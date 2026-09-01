import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  createMinioClient,
  isMinioConfigured,
  MINIO_BUCKET,
  publicObjectUrl,
} from "@/lib/minio-client";
import { BadRequestError } from "@/http/routes/_errors/bad-request-error";

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export type LandingMediaKind = "image" | "video";

export type LandingMediaItem = {
  key: string;
  url: string;
  kind: LandingMediaKind;
  size: number;
  lastModified: string | null;
  etag?: string;
};

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 120) || "file";
}

function kindFromMime(mimetype: string): LandingMediaKind | null {
  if (IMAGE_MIME.has(mimetype)) return "image";
  if (VIDEO_MIME.has(mimetype)) return "video";
  return null;
}

function kindFromKey(key: string): LandingMediaKind {
  const ext = path.extname(key).toLowerCase();
  if ([".mp4", ".webm", ".mov"].includes(ext)) return "video";
  return "image";
}

export class LandingMediaStorageService {
  private async client() {
    if (!isMinioConfigured()) {
      throw new BadRequestError(
        "Upload de mídia indisponível: MinIO não configurado no servidor.",
      );
    }
    return createMinioClient();
  }

  async ensureBucket(): Promise<void> {
    const client = await this.client();
    const exists = await client.bucketExists(MINIO_BUCKET).catch(() => false);
    if (!exists) {
      await client.makeBucket(MINIO_BUCKET);
    }
    // Ensure anonymous read so objects are publicly accessible
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
        },
      ],
    });
    await client.setBucketPolicy(MINIO_BUCKET, policy).catch(() => {
      // Non-fatal: policy may already be set or user may not have permissions
    });
  }

  orgPrefix(orgSlug: string): string {
    return `landing/${orgSlug}/`;
  }

  async upload(params: {
    orgSlug: string;
    filename: string;
    mimetype: string;
    buffer: Buffer;
  }): Promise<LandingMediaItem> {
    const kind = kindFromMime(params.mimetype);
    if (!kind) {
      throw new BadRequestError(
        "Tipo de arquivo não suportado. Use imagem (jpeg, png, webp, gif, avif) ou vídeo (mp4, webm, mov).",
      );
    }

    const maxBytes = kind === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (params.buffer.length > maxBytes) {
      throw new BadRequestError(
        `Arquivo muito grande. Limite: ${kind === "video" ? "100MB" : "10MB"}.`,
      );
    }

    await this.ensureBucket();
    const client = await this.client();
    const key = `${this.orgPrefix(params.orgSlug)}${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFilename(params.filename)}`;

    await client.putObject(MINIO_BUCKET, key, params.buffer, params.buffer.length, {
      "Content-Type": params.mimetype,
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    return {
      key,
      url: publicObjectUrl(key),
      kind,
      size: params.buffer.length,
      lastModified: new Date().toISOString(),
    };
  }

  async list(orgSlug: string, kind?: LandingMediaKind): Promise<LandingMediaItem[]> {
    await this.ensureBucket();
    const client = await this.client();
    const prefix = this.orgPrefix(orgSlug);
    const items: LandingMediaItem[] = [];

    const stream = client.listObjectsV2(MINIO_BUCKET, prefix, true);

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj) => {
        if (!obj.name || obj.name.endsWith("/")) return;
        const itemKind = kindFromKey(obj.name);
        if (kind && itemKind !== kind) return;
        items.push({
          key: obj.name,
          url: publicObjectUrl(obj.name),
          kind: itemKind,
          size: obj.size ?? 0,
          lastModified: obj.lastModified
            ? new Date(obj.lastModified).toISOString()
            : null,
          etag: obj.etag,
        });
      });
      stream.on("error", reject);
      stream.on("end", () => resolve());
    });

    return items.sort((a, b) =>
      (b.lastModified || "").localeCompare(a.lastModified || ""),
    );
  }
}

export const landingMediaStorageService = new LandingMediaStorageService();
