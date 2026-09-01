'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, FileText, ImageIcon, Mic } from 'lucide-react';
import { api } from '@/http/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { OcAudioPlayer } from './oc-audio-player';

export type OcMediaKind = 'image' | 'sticker' | 'audio' | 'video' | 'document';

function resolveKind(
  kind?: string | null,
  mimetype?: string | null,
): OcMediaKind {
  const k = (kind || '').toLowerCase();
  if (k === 'sticker') return 'sticker';
  if (k === 'audio') return 'audio';
  if (k === 'video') return 'video';
  if (k === 'document') return 'document';
  if (k === 'image') return 'image';
  const mt = (mimetype || '').toLowerCase();
  if (mt.startsWith('image/')) return 'image';
  if (mt.startsWith('audio/')) return 'audio';
  if (mt.startsWith('video/')) return 'video';
  return 'document';
}

/** Detecta payload corrompido (ex.: Buffer serializado como JSON pelo Fastify). */
async function assertBinaryBlob(blob: Blob, expectedKind: OcMediaKind): Promise<Blob> {
  if (blob.size < 8) throw new Error('Arquivo vazio');

  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const asText = new TextDecoder().decode(head).trimStart();

  // Erro JSON da API ou serializer: {"type":"Buffer"...} / {"message":"..."}
  if (asText.startsWith('{') || asText.startsWith('[')) {
    throw new Error('Resposta de mídia inválida (JSON)');
  }

  if (expectedKind === 'document') {
    const isPdf =
      blob.type === 'application/pdf' ||
      blob.type.includes('pdf') ||
      asText.startsWith('%PDF');
    if (isPdf && !asText.startsWith('%PDF')) {
      throw new Error('PDF inválido');
    }
  }

  return blob;
}

export function OcMensagemMedia({
  conversaId,
  mensagemId,
  kind,
  mimetype,
  fileName,
  alt,
  className,
  unavailable,
}: {
  conversaId: string;
  mensagemId: string;
  kind?: string | null;
  mimetype?: string | null;
  fileName?: string | null;
  alt?: string;
  className?: string;
  /** stub legado / sem binário — não chama /media */
  unavailable?: boolean;
}) {
  const params = useParams();
  const org = typeof params.slug === 'string' ? params.slug : '';
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobMime, setBlobMime] = useState<string>('application/octet-stream');
  const [failed, setFailed] = useState(Boolean(unavailable));
  const [previewOpen, setPreviewOpen] = useState(false);
  const mediaKind = resolveKind(kind, mimetype);
  const label = fileName?.trim() || alt || 'Arquivo';

  useEffect(() => {
    if (!org || unavailable) {
      setFailed(Boolean(unavailable));
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const blob = await api
          .get(
            `organizations/${org}/omnichannel/conversas/${conversaId}/mensagens/${mensagemId}/media`,
          )
          .blob();
        if (cancelled) return;

        const safe = await assertBinaryBlob(blob, mediaKind);
        // Força MIME esperado quando o servidor manda octet-stream
        const typed =
          safe.type && safe.type !== 'application/octet-stream'
            ? safe
            : new Blob([safe], {
                type:
                  mimetype ||
                  (mediaKind === 'image'
                    ? 'image/jpeg'
                    : mediaKind === 'audio'
                      ? 'audio/ogg'
                      : mediaKind === 'video'
                        ? 'video/mp4'
                        : mediaKind === 'document'
                          ? 'application/pdf'
                          : 'application/octet-stream'),
              });

        objectUrl = URL.createObjectURL(typed);
        setBlobUrl(objectUrl);
        setBlobMime(typed.type || mimetype || 'application/octet-stream');
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [org, conversaId, mensagemId, mimetype, mediaKind, unavailable]);

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-4 text-xs text-muted-foreground',
          className,
        )}
      >
        {mediaKind === 'audio' ? (
          <Mic className="h-4 w-4 shrink-0" />
        ) : mediaKind === 'document' ? (
          <FileText className="h-4 w-4 shrink-0" />
        ) : (
          <ImageIcon className="h-4 w-4 shrink-0" />
        )}
        Não foi possível carregar o anexo
      </div>
    );
  }

  if (!blobUrl) {
    return <div className={cn('h-16 animate-pulse rounded-lg bg-muted/50', className)} />;
  }

  if (mediaKind === 'audio' || blobMime.startsWith('audio/')) {
    return (
      <OcAudioPlayer
        src={blobUrl}
        downloadName={label}
        className={cn('mb-1', className)}
      />
    );
  }

  if (mediaKind === 'video' || blobMime.startsWith('video/')) {
    return (
      <video
        controls
        preload="metadata"
        src={blobUrl}
        className={cn('mb-1 max-h-72 w-full rounded-lg bg-black/5', className)}
      />
    );
  }

  if (
    mediaKind === 'document' ||
    (!blobMime.startsWith('image/') && mediaKind !== 'image' && mediaKind !== 'sticker')
  ) {
    return (
      <div
        className={cn(
          'mb-1 flex items-center gap-2.5 rounded-lg bg-black/[0.04] px-3 py-2.5 dark:bg-white/10',
          className,
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <FileText className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" asChild>
          <a href={blobUrl} download={label} target="_blank" rel="noreferrer">
            <Download className="mr-1 h-3.5 w-3.5" />
            Baixar
          </a>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={blobUrl}
        alt={alt ?? 'Imagem'}
        title="Duplo clique para ampliar"
        className={cn(
          'mb-1 max-h-72 w-full cursor-zoom-in rounded-lg object-cover',
          className,
        )}
        onError={() => setFailed(true)}
        onDoubleClick={() => setPreviewOpen(true)}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="flex max-h-[96vh] max-w-[min(96vw,1200px)] flex-col gap-3 border-0 bg-black/95 p-3 sm:p-4 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:text-white"
          showCloseButton
        >
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobUrl}
              alt={alt ?? 'Imagem'}
              className="max-h-[calc(96vh-5rem)] w-full object-contain"
            />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 px-1">
            <span className="min-w-0 truncate text-sm text-white/80">{label}</span>
            <Button type="button" size="sm" variant="secondary" className="shrink-0" asChild>
              <a href={blobUrl} download={label} target="_blank" rel="noreferrer">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Baixar
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
