'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Send, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { formatClinicWallTimeHM, parseClinicDateTime } from '@/lib/clinic-datetime';
import { useFloatingToolbarInsetStyle } from '@/hooks/use-floating-toolbar-inset';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OcContactAvatar } from './oc-contact-avatar';
import { Badge } from '@/components/ui/badge';
import {
  useOcConversaQuery,
  useOcMensagensQuery,
  useOcEnviarMensagem,
  useOcEnviarAnexo,
  useOcEnviarNotaInterna,
  useOcMarcarConversaLidas,
  useOcReabrirConversa,
} from '../hooks/use-oc-api';
import type { OcContato, OcMensagem } from '../types';
import { OcConversaHeader } from './inbox/oc-conversa-header';
import { OcMensagemMedia } from './inbox/oc-mensagem-media';
import { OcComposerCliente } from './inbox/oc-composer-cliente';

type ComposerMode = 'cliente' | 'nota';

function isNotaInterna(msg: OcMensagem) {
  return msg.tipo === 'system' && msg.extra_data?.nota_interna === true;
}

function isSistemaEvento(msg: OcMensagem) {
  return msg.tipo === 'system' && !msg.extra_data?.nota_interna;
}

function isImageMessage(msg: OcMensagem) {
  return (
    msg.tipo === 'image'
    || msg.extra_data?.media?.media_kind === 'image'
    || msg.extra_data?.media?.media_kind === 'sticker'
    || msg.conteudo === '[Imagem]'
    || msg.conteudo === '[Figurinha]'
  );
}

function isDocumentMessage(msg: OcMensagem) {
  return (
    msg.tipo === 'document'
    || msg.extra_data?.media?.media_kind === 'document'
    || msg.conteudo.startsWith('[Documento]')
  );
}

function isAudioMessage(msg: OcMensagem) {
  return (
    msg.tipo === 'audio'
    || msg.extra_data?.media?.media_kind === 'audio'
    || msg.conteudo === '[Áudio]'
  );
}

function isVideoMessage(msg: OcMensagem) {
  return (
    msg.tipo === 'video'
    || msg.extra_data?.media?.media_kind === 'video'
    || msg.conteudo === '[Vídeo]'
  );
}

function isMediaMessage(msg: OcMensagem) {
  return isImageMessage(msg) || isAudioMessage(msg) || isVideoMessage(msg) || isDocumentMessage(msg);
}

function mediaFileName(msg: OcMensagem): string | undefined {
  const fromExtra = msg.extra_data?.media?.file_name?.trim();
  if (fromExtra) return fromExtra;
  const docMatch = msg.conteudo.match(/^\[Documento\]\s*(.+)$/);
  if (docMatch?.[1]) return docMatch[1].trim();
  return undefined;
}

function SistemaEventoBubble({ msg }: { msg: OcMensagem }) {
  return (
    <div className="flex justify-center px-2 py-0.5">
      <div className="max-w-[min(92%,480px)] rounded-lg bg-black/[0.06] px-3 py-1.5 text-center text-xs text-muted-foreground dark:bg-white/10">
        <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
        <span className="mt-0.5 block text-[10px] opacity-70">
          {formatClinicWallTimeHM(parseClinicDateTime(msg.created_at) ?? new Date())}
        </span>
      </div>
    </div>
  );
}

function NotaInternaBubble({ msg }: { msg: OcMensagem }) {
  const autorNome = msg.extra_data?.autor_nome
    ?? (msg.autor_tipo === 'agente' ? 'Assistente IA' : 'Atendente');

  return (
    <div className="flex justify-center px-2">
      <div className="w-full max-w-[92%] rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-50">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{autorNome}</span>
          <Badge
            variant="outline"
            className="h-5 border-amber-300 bg-amber-100/80 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-100"
          >
            Nota interna
          </Badge>
          {msg.extra_data?.handoff_resumo ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              Resumo handoff
            </Badge>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
        <span className="mt-1 block text-[10px] text-amber-800/70 dark:text-amber-200/60">
          {formatClinicWallTimeHM(parseClinicDateTime(msg.created_at) ?? new Date())}
        </span>
      </div>
    </div>
  );
}

function Bubble({
  msg,
  conversaId,
  contato,
}: {
  msg: OcMensagem;
  conversaId: string;
  contato?: OcContato | null;
}) {
  if (isSistemaEvento(msg)) {
    return <SistemaEventoBubble msg={msg} />;
  }

  if (isNotaInterna(msg)) {
    return <NotaInternaBubble msg={msg} />;
  }

  const isContato = msg.autor_tipo === 'contato';
  const showMedia = isMediaMessage(msg);
  const mediaKind =
    msg.extra_data?.media?.media_kind
    ?? (isAudioMessage(msg) ? 'audio' : isVideoMessage(msg) ? 'video' : isDocumentMessage(msg) ? 'document' : 'image');

  return (
    <div className={cn('flex min-w-0 gap-2 px-1', isContato ? 'justify-start' : 'justify-end')}>
      {isContato ? (
        <OcContactAvatar
          contato={contato}
          className="mt-0.5 h-8 w-8 shrink-0"
          fallbackClassName="text-[10px] text-muted-foreground"
        />
      ) : null}
      <div
        className={cn(
          'min-w-0 max-w-[min(65%,520px)] overflow-hidden rounded-lg px-3 py-1.5 text-[14.2px] leading-snug text-foreground',
          isContato
            ? 'oc-chat-bubble-in rounded-tl-none'
            : msg.autor_tipo === 'agente'
              ? 'oc-chat-bubble-out-ia rounded-tr-none'
              : 'oc-chat-bubble-out rounded-tr-none',
        )}
      >
        {showMedia ? (
          <OcMensagemMedia
            conversaId={conversaId}
            mensagemId={msg.id}
            kind={mediaKind}
            mimetype={msg.extra_data?.media?.mimetype}
            fileName={mediaFileName(msg)}
            alt={msg.conteudo}
            className="mb-1"
            unavailable={msg.extra_data?.media?.stub === true}
          />
        ) : null}
        {(() => {
          const placeholder = /^\[(Imagem|Figurinha|Áudio|Vídeo|Documento)( .+)?\]$/.test(msg.conteudo);
          if (!msg.conteudo || (showMedia && placeholder)) return null;
          return <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>;
        })()}
        <span
          className={cn(
            'mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground',
            isContato && 'justify-start',
          )}
        >
          {msg.autor_tipo === 'agente' && (
            <span className="font-medium text-emerald-700/80 dark:text-emerald-300/80">IA</span>
          )}
          <span>{formatClinicWallTimeHM(parseClinicDateTime(msg.created_at) ?? new Date())}</span>
        </span>
      </div>
    </div>
  );
}

export function OcThread({ conversaId }: { conversaId: string }) {
  const { data: conversa } = useOcConversaQuery(conversaId);
  const { data: mensagens = [] } = useOcMensagensQuery(conversaId);
  const enviarMutation = useOcEnviarMensagem();
  const anexoMutation = useOcEnviarAnexo();
  const notaMutation = useOcEnviarNotaInterna();
  const marcarLidas = useOcMarcarConversaLidas();
  const reabrir = useOcReabrirConversa();
  const composerInset = useFloatingToolbarInsetStyle();
  const [texto, setTexto] = useState('');
  const [modo, setModo] = useState<ComposerMode>('cliente');
  const [replyDestino, setReplyDestino] = useState<'email' | 'whatsapp' | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevConversaIdRef = useRef(conversaId);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 96;
  }, []);

  useEffect(() => {
    if (!conversaId) return;
    marcarLidas.mutate(conversaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apenas ao trocar de conversa
  }, [conversaId]);

  useEffect(() => {
    if (prevConversaIdRef.current !== conversaId) {
      stickToBottomRef.current = true;
      prevConversaIdRef.current = conversaId;
      setReplyDestino(null);
    }
  }, [conversaId]);

  useEffect(() => {
    if (!conversa || conversa.canal?.tipo !== 'landing_form') return;
    if (replyDestino) return;
    const hasPhone = Boolean(conversa.contato?.telefone?.trim());
    const hasEmail = Boolean(conversa.contato?.email?.trim());
    const preferred = conversa.preferred_reply;
    if (preferred === 'whatsapp' && hasPhone) setReplyDestino('whatsapp');
    else if (preferred === 'email' && hasEmail) setReplyDestino('email');
    else if (hasPhone) setReplyDestino('whatsapp');
    else if (hasEmail) setReplyDestino('email');
  }, [conversa, replyDestino]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;

    scrollToBottom('auto');
    const raf = requestAnimationFrame(() => {
      scrollToBottom('auto');
      requestAnimationFrame(() => scrollToBottom('auto'));
    });
    return () => cancelAnimationFrame(raf);
  }, [conversaId, mensagens, scrollToBottom]);

  useEffect(() => {
    const content = messagesContentRef.current;
    if (!content) return;

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) scrollToBottom('auto');
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [conversaId, scrollToBottom]);

  const pending = enviarMutation.isPending || anexoMutation.isPending || notaMutation.isPending;

  const isLanding = conversa?.canal?.tipo === 'landing_form';
  const replyDestinoOptions = isLanding
    ? [
        {
          value: 'whatsapp' as const,
          label: 'WhatsApp',
          disabled: !conversa?.contato?.telefone?.trim(),
          title: conversa?.contato?.telefone
            ? `WhatsApp · ${conversa.contato.telefone_formatado || conversa.contato.telefone}`
            : 'WhatsApp (sem telefone)',
        },
        {
          value: 'email' as const,
          label: 'E-mail',
          disabled: !conversa?.contato?.email?.trim(),
          title: conversa?.contato?.email
            ? `E-mail · ${conversa.contato.email}`
            : 'E-mail (sem endereço)',
        },
      ]
    : undefined;

  const handleEnviar = () => {
    if (!texto.trim() || pending) return;
    stickToBottomRef.current = true;
    if (modo === 'nota') {
      notaMutation.mutate({ conversaId, conteudo: texto.trim() });
    } else {
      enviarMutation.mutate(
        {
          conversaId,
          conteudo: texto.trim(),
          ...(isLanding && replyDestino ? { destino: replyDestino } : {}),
        },
        {
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Falha ao enviar');
          },
        },
      );
    }
    setTexto('');
  };

  if (!conversa) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const encerrada = conversa.status === 'closed';

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <OcConversaHeader conversa={conversa} />

      <div
        ref={messagesRef}
        onScroll={handleMessagesScroll}
        className="oc-chat-messages-bg min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-3 sm:px-8"
      >
        <div ref={messagesContentRef} className="md:min-w-0 space-y-2">
          {mensagens.map((m) => (
            <Bubble key={m.id} msg={m} conversaId={conversaId} contato={conversa?.contato} />
          ))}
        </div>
      </div>

      {encerrada ? (
        <div
          className="oc-chat-composer-bar min-w-0 shrink-0 border-t bg-muted/30 px-4 py-4 text-center"
          style={composerInset}
        >
          <p className="text-sm text-muted-foreground">
            Esta conversa está encerrada. Não é possível enviar mensagens.
          </p>
          <Button
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() =>
              reabrir.mutate(conversaId, {
                onSuccess: () => toast.success('Conversa reaberta'),
                onError: () => toast.error('Não foi possível reabrir a conversa'),
              })
            }
            disabled={reabrir.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reabrir conversa
          </Button>
        </div>
      ) : (
        <div
          className="oc-chat-composer-bar min-w-0 shrink-0 overflow-hidden border-t p-3"
          style={composerInset}
        >
          <div className="mb-2 inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-background/80 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setModo('cliente')}
              className={cn(
                'inline-flex shrink-0 items-center rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                modo === 'cliente'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mensagem ao cliente
            </button>
            <button
              type="button"
              onClick={() => setModo('nota')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                modo === 'nota'
                  ? 'bg-amber-100 text-amber-950 shadow-sm dark:bg-amber-950/60 dark:text-amber-50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <StickyNote className="h-3 w-3 shrink-0" />
              Nota interna
            </button>
          </div>
          {modo === 'cliente' ? (
            <OcComposerCliente
              texto={texto}
              onTextoChange={setTexto}
              disabled={pending}
              onSendText={handleEnviar}
              onSendFile={(file, legenda) => {
                stickToBottomRef.current = true;
                anexoMutation.mutate({ conversaId, file, legenda });
                setTexto('');
              }}
              replyDestino={replyDestino ?? undefined}
              onReplyDestinoChange={setReplyDestino}
              replyDestinoOptions={replyDestinoOptions}
            />
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <StickyNote className="h-5 w-5 text-amber-600" />
              </div>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreva uma nota visível apenas para a equipe..."
                className={cn(
                  'min-h-[42px] max-h-32 flex-1 resize-none rounded-xl border-0 bg-background px-4 py-2.5 text-sm shadow-sm',
                  'border border-amber-200/80 bg-amber-50/60 focus-visible:ring-amber-300',
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviar();
                  }
                }}
              />
              {texto.trim() ? (
                <Button
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full"
                  onClick={handleEnviar}
                  disabled={pending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
          {modo === 'nota' ? (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Notas internas não são enviadas ao cliente — use para contexto da equipe.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
