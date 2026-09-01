"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadLandingMedia } from "@/hooks/use-landing-cms";

export type GalleryImage = { url: string; alt?: string };

type Props = {
  org: string;
  value: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
};

export function LandingGalleryFieldEditor({ org, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadLandingMedia(org);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const uploaded: GalleryImage[] = [];
    for (const file of Array.from(files)) {
      try {
        const res = await upload.mutateAsync(file);
        uploaded.push({ url: res.media.url, alt: "" });
      } catch {
        // toast de erro já disparado no hook
      }
    }
    if (uploaded.length > 0) onChange([...value, ...uploaded]);
  }

  function updateAlt(index: number, alt: string) {
    const next = [...value];
    next[index] = { ...next[index]!, alt };
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Galeria de fotos</h4>
          <p className="text-xs text-muted-foreground">
            Envie uma ou mais imagens deste projeto. Aparecem na página /projetos.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
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
          Enviar fotos
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma foto ainda.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((img, index) => (
            <div key={img.url + index} className="space-y-2 rounded-md border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || ""}
                className="aspect-video w-full rounded object-cover"
              />
              <Input
                value={img.alt ?? ""}
                onChange={(e) => updateAlt(index, e.target.value)}
                placeholder="Texto alternativo (alt)"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => remove(index)}
                className="w-full text-destructive"
              >
                <Trash2 className="size-4" />
                Remover
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
