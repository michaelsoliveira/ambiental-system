'use client';

import { useOcBasePath } from '../lib/oc-routes';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { OcContactAvatar } from './oc-contact-avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useOcConversasQuery, useOcCanaisQuery, useOcInboxesQuery } from '../hooks/use-oc-api';
import type { OcConversa, StatusConversa } from '../types';
import { useOcStore } from '@/stores/use-oc-store';
import { OcInboxFiltersMenu } from './inbox/oc-inbox-filters-menu';
import { OcCanalIcon } from './canais/oc-canal-icon';
import { formatContactLine, formatMessageTime } from '../lib/oc-contact-display';

const DEFAULT_RUNTIME_FILTROS = {
  canalFiltro: null,
  atribuicaoFiltro: 'todas' as const,
  buscaTexto: '',
  filtroNaoLidas: false,
  filtroArquivadas: false,
  filtroGrupos: false,
  tagsFiltro: [] as string[],
};

function statusPrefix(status: StatusConversa) {
  if (status === 'bot') return '[IA]';
  if (status === 'pending') return '[CA]';
  return null;
}

function ConversaItem({
  conversa,
  active,
  inboxQuery,
}: {
  conversa: OcConversa;
  active: boolean;
  inboxQuery?: string;
}) {
  const { slug } = useOcBasePath();
  const router = useRouter();
  const status = conversa.status as StatusConversa;
  const { title, subtitle } = formatContactLine(conversa.contato);
  const prefix = statusPrefix(status);
  const unread = active ? 0 : (conversa.nao_lidas ?? 0);
  const href = inboxQuery
    ? `/org/${slug}/omnichannel/inbox/${conversa.id}?inbox=${inboxQuery}`
    : `/org/${slug}/omnichannel/inbox/${conversa.id}`;

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={cn(
        'flex w-full gap-3 px-3 py-3 text-left transition-colors',
        'hover:bg-[var(--oc-chat-list-hover)]',
        active && 'bg-[var(--oc-chat-list-active)]',
      )}
    >
      <OcContactAvatar contato={conversa.contato} className="h-12 w-12" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('truncate text-[15px]', unread > 0 ? 'font-semibold' : 'font-medium')}>
            {prefix && <span className="font-normal text-muted-foreground">{prefix} </span>}
            {title}
            {subtitle && (
              <span className="font-normal text-muted-foreground"> {subtitle}</span>
            )}
          </p>
          <span
            className={cn(
              'shrink-0 text-[11px]',
              unread > 0 ? 'font-medium text-[var(--oc-chat-unread)]' : 'text-muted-foreground',
            )}
          >
            {formatMessageTime(conversa.last_message_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-muted-foreground">
            {conversa.ultima_mensagem || 'Sem mensagens'}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--oc-chat-unread)] px-1.5 text-[11px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function OcInbox({ conversaAtivaId }: { conversaAtivaId?: string }) {
  const { slug } = useOcBasePath();

  const searchParams = useSearchParams();
  const inboxIdParam = searchParams.get('inbox');
  const viewParam = searchParams.get('view');
  const {
    canalFiltro,
    customInboxId,
    atribuicaoFiltro,
    buscaTexto,
    filtroNaoLidas,
    filtroArquivadas,
    filtroGrupos,
    tagsFiltro,
    setFiltros,
  } = useOcStore();
  const { data: inboxesData } = useOcInboxesQuery();
  const [buscaLocal, setBuscaLocal] = useState(buscaTexto);

  const activeInboxId = customInboxId ?? inboxIdParam;
  const isGeral = !activeInboxId && !viewParam;

  useEffect(() => {
    setBuscaLocal(buscaTexto);
  }, [buscaTexto]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (buscaLocal !== buscaTexto) {
        setFiltros({ buscaTexto: buscaLocal });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [buscaLocal, buscaTexto, setFiltros]);

  useEffect(() => {
    if (inboxIdParam) {
      setFiltros({
        customInboxId: inboxIdParam,
        ...DEFAULT_RUNTIME_FILTROS,
      });
      return;
    }

    if (viewParam === 'pendentes') {
      setFiltros({
        customInboxId: null,
        ...DEFAULT_RUNTIME_FILTROS,
        filtroNaoLidas: true,
      });
    } else if (viewParam === 'arquivadas') {
      setFiltros({
        customInboxId: null,
        ...DEFAULT_RUNTIME_FILTROS,
        filtroArquivadas: true,
      });
    } else if (!viewParam && !inboxIdParam) {
      setFiltros({
        customInboxId: null,
        ...DEFAULT_RUNTIME_FILTROS,
      });
    }
  }, [inboxIdParam, viewParam, setFiltros]);

  const statusesApi = useMemo(() => {
    const statuses: string[] = [];
    if (filtroNaoLidas) statuses.push('pending');
    if (filtroArquivadas) statuses.push('closed');
    return statuses.length > 0 ? statuses : undefined;
  }, [filtroNaoLidas, filtroArquivadas]);

  const tipoConversaApi = useMemo(() => {
    if (filtroGrupos) return 'todas';
    if (isGeral) return 'individual';
    return undefined;
  }, [filtroGrupos, isGeral]);

  const atribuicaoApi = atribuicaoFiltro === 'minhas' ? 'minha' : 'qualquer';

  const { data: conversas = [], isLoading } = useOcConversasQuery({
    inbox_id: activeInboxId ?? undefined,
    statuses: statusesApi,
    canal_id: isGeral ? (canalFiltro ?? undefined) : undefined,
    tags: tagsFiltro.length > 0 ? tagsFiltro : undefined,
    tipo_conversa: tipoConversaApi,
    atribuicao: activeInboxId
      ? atribuicaoFiltro === 'minhas'
        ? 'minha'
        : undefined
      : atribuicaoApi,
    q: buscaTexto || undefined,
  });
  const { data: canais = [] } = useOcCanaisQuery();

  const inboxAtiva = activeInboxId
    ? inboxesData?.find((i) => i.id === activeInboxId)
    : null;

  const titulo =
    inboxAtiva?.nome ??
    (viewParam === 'pendentes'
      ? 'Não lidas'
      : viewParam === 'arquivadas'
        ? 'Arquivadas'
        : 'Geral');

  return (
    <div className="oc-chat-list-panel flex h-full max-h-full min-h-0 w-[min(100%,380px)] max-w-[min(380px,38vw)] min-w-0 shrink basis-[280px] flex-col overflow-hidden border-r">
      <div className="oc-chat-header-bar flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="truncate text-base font-semibold">{titulo}</h2>
        <OcInboxFiltersMenu />
      </div>

      <div className="space-y-2 border-b bg-background px-3 py-2.5 shrink-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={buscaLocal}
            onChange={(e) => setBuscaLocal(e.target.value)}
            placeholder="Buscar ou começar nova conversa"
            className="h-9 rounded-lg border-0 bg-muted/70 pl-9 text-sm shadow-none focus-visible:ring-1"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={atribuicaoFiltro}
            onValueChange={(v) =>
              setFiltros({ atribuicaoFiltro: v as 'todas' | 'minhas' })
            }
          >
            <SelectTrigger className="h-8 flex-1 border-0 bg-muted/50 text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as conversas</SelectItem>
              <SelectItem value="minhas">Minhas conversas</SelectItem>
            </SelectContent>
          </Select>

          {isGeral && (
            <Select
              value={canalFiltro || 'todos'}
              onValueChange={(v) => setFiltros({ canalFiltro: v === 'todos' ? null : v })}
            >
              <SelectTrigger className="h-8 flex-1 border-0 bg-muted/50 text-xs shadow-none">
                <SelectValue placeholder="Canal">
                  {canalFiltro ? (
                    <span className="flex items-center gap-2">
                      <OcCanalIcon
                        tipo={canais.find((c) => c.id === canalFiltro)?.tipo}
                      />
                      {canais.find((c) => c.id === canalFiltro)?.nome}
                    </span>
                  ) : (
                    'Todos os canais'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os canais</SelectItem>
                {canais.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <OcCanalIcon tipo={c.tipo} />
                      {c.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-border/30 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Carregando...</div>
        ) : conversas.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-6 w-6 opacity-30" />
            Nenhuma conversa
          </div>
        ) : (
          conversas.map((c) => (
            <ConversaItem
              key={c.id}
              conversa={c}
              active={c.id === conversaAtivaId}
              inboxQuery={activeInboxId ?? undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
