import { Client } from "minio";

const useSSL = process.env.MINIO_USE_SSL === "true";

export const MINIO_BUCKET =
  process.env.MINIO_BUCKET || "landing-media";

/** Base pública para URLs consumidas pela landing (ex.: https://minio.ambiental.com.br/landing-media). */
export const MINIO_PUBLIC_URL = (
  process.env.MINIO_PUBLIC_URL ||
  `https://minio.ambiental.com.br/${MINIO_BUCKET}`
).replace(/\/$/, "");

export function isMinioConfigured(): boolean {
  return Boolean(
    process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY,
  );
}

export function createMinioClient(): Client {
  if (!isMinioConfigured()) {
    throw new Error(
      "MinIO não configurado. Defina MINIO_ACCESS_KEY e MINIO_SECRET_KEY.",
    );
  }

  return new Client({
    endPoint: process.env.MINIO_ENDPOINT || "minio.ambiental.com.br",
    port: process.env.MINIO_PORT
      ? Number(process.env.MINIO_PORT)
      : useSSL
        ? 443
        : 9000,
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

export function publicObjectUrl(key: string): string {
  return `${MINIO_PUBLIC_URL}/${key.replace(/^\//, "")}`;
}
