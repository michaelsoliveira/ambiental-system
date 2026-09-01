"use client";

import { FolderOpen, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type LandingMediaField,
  MEDIA_KIND_OPTIONS,
  MEDIA_MOTION_OPTIONS,
  type MediaKind,
  type MediaMotion,
} from "@/features/landing-cms/types";
import {
  useLandingMediaLibrary,
  useUploadLandingMedia,
} from "@/hooks/use-landing-cms";
import { cn } from "@/lib/utils";

type Props = {
  org: string;
  value: LandingMediaField;
  onChange: (next: LandingMediaField) => void;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function MediaPreview({ media }: { media: LandingMediaField }) {
  if (media.kind === "image" && media.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.src}
        alt={media.alt || "Prévia"}
        className="aspect-[4/3] w-full max-w-md rounded-lg border object-cover"
      />
    );
  }

  if (media.kind === "video" && media.src) {
    const isMov =
      media.src.toLowerCase().endsWith(".mov") ||
      media.src.toLowerCase().includes(".mov?");
    const mimeType = isMov ? "video/quicktime" : undefined;
    return (
      <div className="space-y-2">
        <video
          poster={media.poster}
          className="aspect-video w-full max-w-md rounded-lg border object-cover"
          muted
          loop
          playsInline
          controls
        >
          <source src={media.src} type={mimeType} />
          Seu browser não suporta reprodução de vídeo.
        </video>
        {isMov && (
          <p className="max-w-md rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            ⚠️ Arquivo .MOV (QuickTime): Chrome e Firefox não reproduzem este
            formato. Converta para <strong>.mp4 (H.264)</strong> para funcionar
            em todos os browsers.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
      Sem mídia — a landing usa o mockup padrão
    </div>
  );
}

export function LandingMediaFieldEditor({ org, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickingFor, setPickingFor] = useState<"src" | "poster">("src");

  const libraryKind =
    pickingFor === "poster"
      ? "image"
      : value.kind === "none"
        ? undefined
        : value.kind;

  const library = useLandingMediaLibrary(org, libraryKind, libraryOpen);
  const upload = useUploadLandingMedia(org);

  function patch(partial: Partial<LandingMediaField>) {
    onChange({ ...value, ...partial });
  }

  function handleKindChange(kind: MediaKind) {
    if (kind === "none") {
      onChange({ kind: "none", motion: value.motion || "none" });
      return;
    }
    patch({
      kind,
      motion: kind === "video" && value.motion === "kenburns" ? "none" : value.motion,
    });
  }

  async function handleFile(file: File | undefined, target: "src" | "poster") {
    if (!file) return;

    const isMovFile =
      file.name.toLowerCase().endsWith(".mov") ||
      file.type === "video/quicktime";
    if (isMovFile && target === "src") {
      toast.warning(
        "Arquivo .MOV detectado — alguns browsers (Chrome, Firefox) não reproduzem QuickTime. Converta para .mp4 (H.264) para máxima compatibilidade.",
        { duration: 8000 },
      );
    }

    try {
      const res = await upload.mutateAsync(file);
      if (target === "poster") {
        patch({ poster: res.media.url });
      } else {
        patch({
          src: res.media.url,
          kind: res.media.kind,
          motion: res.media.kind === "image" ? "none" : value.motion,
        });
      }
    } catch {
      // toast no hook
    }
  }

  const motionOptions =
    value.kind === "video"
      ? MEDIA_MOTION_OPTIONS.filter((o) => o.value !== "kenburns")
      : MEDIA_MOTION_OPTIONS;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">Mídia da seção</h3>
        <p className="text-xs text-muted-foreground">
          Envie imagem/vídeo ao MinIO ou escolha da biblioteca. Motion aplica
          presets da landing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tipo de mídia">
          <Select
            value={value.kind || "none"}
            onValueChange={(v) => handleKindChange(v as MediaKind)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_KIND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  <span className="ml-2 text-muted-foreground">— {opt.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Motion"
          hint={
            value.kind === "video"
              ? "Ken Burns só se aplica a imagens"
              : undefined
          }
        >
          <Select
            value={value.motion || "none"}
            onValueChange={(v) => patch({ motion: v as MediaMotion })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Motion" />
            </SelectTrigger>
            <SelectContent>
              {motionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  <span className="ml-2 text-muted-foreground">— {opt.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {value.kind !== "none" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={
                value.kind === "video"
                  ? "video/mp4,video/webm,video/quicktime"
                  : "image/jpeg,image/png,image/webp,image/gif,image/avif"
              }
              onChange={(e) => {
                void handleFile(e.target.files?.[0], "src");
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Enviar {value.kind === "video" ? "vídeo" : "imagem"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPickingFor("src");
                setLibraryOpen(true);
              }}
            >
              <FolderOpen className="size-4" />
              Biblioteca
            </Button>
            {value.src ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => patch({ src: undefined })}
              >
                <Trash2 className="size-4" />
                Remover
              </Button>
            ) : null}
          </div>

          <MediaPreview media={value} />

          <Field label="Texto alternativo (alt)">
            <Input
              value={value.alt ?? ""}
              onChange={(e) => patch({ alt: e.target.value })}
              placeholder="Descrição acessível da mídia"
            />
          </Field>

          {value.kind === "video" ? (
            <div className="space-y-3 rounded-md border border-dashed p-3">
              <p className="text-sm font-medium">Poster do vídeo</p>
              <p className="text-xs text-muted-foreground">
                Frame estático enquanto o vídeo carrega (recomendado).
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={posterRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0], "poster");
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={upload.isPending}
                  onClick={() => posterRef.current?.click()}
                >
                  <Upload className="size-4" />
                  Enviar poster
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPickingFor("poster");
                    setLibraryOpen(true);
                  }}
                >
                  <FolderOpen className="size-4" />
                  Escolher
                </Button>
                {value.poster ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => patch({ poster: undefined })}
                  >
                    Limpar
                  </Button>
                ) : null}
              </div>
              {value.poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value.poster}
                  alt="Poster"
                  className="h-24 rounded border object-cover"
                />
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Biblioteca de mídia</DialogTitle>
            <DialogDescription>
              Arquivos já enviados ao MinIO nesta organização.
            </DialogDescription>
          </DialogHeader>
          {library.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando…
            </div>
          ) : library.error ? (
            <p className="py-4 text-sm text-destructive">
              {(library.error as Error).message}
            </p>
          ) : (library.data?.media.length ?? 0) === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              Nenhum arquivo ainda. Use &quot;Enviar&quot; para fazer upload.
            </p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {library.data!.media.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    "overflow-hidden rounded-lg border text-left transition hover:border-primary",
                    (pickingFor === "src" ? value.src : value.poster) ===
                      item.url && "ring-2 ring-primary",
                  )}
                  onClick={() => {
                    if (pickingFor === "poster") {
                      if (item.kind !== "image") {
                        toast.error("Poster precisa ser uma imagem");
                        return;
                      }
                      patch({ poster: item.url });
                    } else {
                      patch({
                        src: item.url,
                        kind: item.kind,
                      });
                    }
                    setLibraryOpen(false);
                  }}
                >
                  {item.kind === "video" ? (
                    <video
                      src={item.url}
                      className="aspect-video w-full bg-black object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="truncate px-2 py-1.5 text-xs text-muted-foreground">
                    {item.kind} · {(item.size / 1024).toFixed(0)} KB
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
