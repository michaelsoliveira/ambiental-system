"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadLandingMedia } from "@/hooks/use-landing-cms";

export type SingleImage = { url: string; alt?: string };

type Props = {
  org: string;
  value: SingleImage | undefined;
  onChange: (next: SingleImage | undefined) => void;
};

/** Campo de imagem única (ex.: foto de um serviço) — upload direto para o MinIO. */
export function LandingImageFieldEditor({ org, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadLandingMedia(org);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const res = await upload.mutateAsync(file);
      onChange({ url: res.media.url, alt: value?.alt ?? "" });
    } catch {
      // toast de erro já disparado no hook
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {value?.url ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.url}
            alt={value.alt || ""}
            className="aspect-video w-full max-w-sm rounded object-cover"
          />
          <Input
            value={value.alt ?? ""}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Texto alternativo (alt)"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Trocar foto
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => onChange(undefined)}
            >
              <Trash2 className="size-4" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {upload.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Enviar foto
        </Button>
      )}
    </div>
  );
}
