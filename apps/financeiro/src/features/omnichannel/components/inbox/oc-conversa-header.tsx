'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CircleX,
  ListTree,
  Lock,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OcContactAvatar } from '../oc-contact-avatar';
import { useOrgMembers } from '@/hooks/use-org-members';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  useOcAgentesQuery,
  useOcCardCreate,
  useOcCardPatch,
  useOcConversaPatch,
  useOcEncerrarConversa,
  useOcPipelinesQuery,
  useOcReabrirConversa,
  useOcStagesQuery,
} from '../../hooks/use-oc-api';
import type { OcConversa, OcPipelineStage } from '../../types';
import { formatContactLine } from '../../lib/oc-contact-display';
import { OcCanalIcon, canalTipoLabel } from '../canais/oc-canal-icon';
import { STAGE_BG } from '../pipeline/oc-pipeline-utils';
import { pickDefaultOcAgente } from '../../lib/oc-agente-default';
import { cn } from '@/lib/utils';
import { OcConversaAutomacoesMenu } from './oc-conversa-automacoes-menu';

export function OcConversaHeader({ conversa }: { conversa: OcConversa }) {
  const qc = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id;
  const patch = useOcConversaPatch();
  const encerrar = useOcEncerrarConversa();
  const reabrir = useOcReabrirConversa();
  const encerrada = conversa.status === 'closed';
  const { data: agentes = [] } = useOcAgentesQuery();
  const { data: pipelines = [] } = useOcPipelinesQuery();
  const { data: membros = [] } = useOrgMembers();

  const { title } = formatContactLine(conversa.contato);
  const agentesAtivos = agentes.filter((a) => a.ativo);
  const agentePadrao = pickDefaultOcAgente(agentes);
  const agenteAtual = agentes.find((a) => a.id === conversa.agente_ia_id) ?? agentePadrao;
  const iaAtiva = conversa.status === 'bot';

  const membrosAtribuicao = membros
    .filter((m) => m.user?.is_active !== false)
    .map((m) => ({
      id: m.user_id,
      nome: m.user?.nome || m.user?.username || m.user?.email || 'Membro',
      email: m.user?.email,
    }))
    .filter((m) => m.id && m.id !== String(currentUserId ?? ''));

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['oc', 'conversa', conversa.id] });
    qc.invalidateQueries({ queryKey: ['oc', 'mensagens', conversa.id] });
    qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
  };

  const assignTo = (userId: string) => {
    patch.mutate(
      { id: conversa.id, atendente_id: userId, status: 'open' },
      { onSuccess: () => toast.success('Conversa atribuída') },
    );
  };

  const setAgente = (agenteId: string | null) => {
    patch.mutate(
      {
        id: conversa.id,
        agente_ia_id: agenteId,
        status: agenteId ? 'bot' : 'open',
      },
      { onSuccess: () => toast.success(agenteId ? 'Agente IA ativado' : 'IA desativada') },
    );
  };

  const ativarIaPadrao = () => {
    const alvo = agentePadrao;
    if (!alvo) {
      toast.error('Nenhum agente IA ativo configurado');
      return;
    }
    setAgente(alvo.id);
  };

  const pipelineCard = conversa.pipeline_card;

  return (
    <div className="oc-chat-header-bar flex min-w-0 shrink-0 items-center justify-between gap-3 overflow-hidden border-b px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
        <OcContactAvatar contato={conversa.contato} className="h-10 w-10" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-[15px] font-semibold leading-tight">{title}</p>
            {pipelineCard && (
              <Badge
                variant="outline"
                className={cn(
                  'h-5 shrink-0 px-1.5 text-[10px] font-medium',
                  STAGE_BG[pipelineCard.stage_cor] ?? 'bg-muted',
                )}
              >
                {pipelineCard.stage_tipo === 'ganho' && (
                  <Trophy className="mr-0.5 h-3 w-3 text-green-600" />
                )}
                {pipelineCard.stage_nome}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {conversa.canal && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <OcCanalIcon tipo={conversa.canal.tipo} className="h-3 w-3" />
                {canalTipoLabel(conversa.canal.tipo)} · {conversa.canal.nome}
              </span>
            )}
            {conversa.status === 'pending' && !conversa.atendente_id && (
              <Badge
                variant="outline"
                className="h-5 gap-1 border-amber-200 bg-amber-50 px-1.5 text-[10px] font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              >
                <UserRound className="h-3 w-3" />
                Aguardando humano
              </Badge>
            )}
            {conversa.atendente_id && (
              <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px] font-medium">
                <UserRound className="h-3 w-3" />
                {conversa.atendente_nome ?? 'Atendente humano'}
              </Badge>
            )}
            {iaAtiva && agenteAtual && (
              <Badge
                variant="outline"
                className="h-5 gap-1 border-violet-200 bg-violet-50 px-1.5 text-[10px] font-medium text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200"
              >
                <Sparkles className="h-3 w-3" />
                IA · {agenteAtual.nome}
              </Badge>
            )}
            {encerrada && (
              <Badge
                variant="outline"
                className="h-5 gap-1 border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
              >
                <CircleX className="h-3 w-3" />
                Encerrada
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 shrink flex-wrap items-center justify-end gap-1">
        {encerrada ? (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refresh} title="Atualizar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              onClick={() =>
                reabrir.mutate(conversa.id, {
                  onSuccess: () => toast.success('Conversa reaberta'),
                  onError: () => toast.error('Não foi possível reabrir a conversa'),
                })
              }
              disabled={reabrir.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reabrir
            </Button>
          </>
        ) : (
          <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 bg-background/70 px-2 text-xs shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              <span className="max-w-[72px] truncate">{agenteAtual?.nome ?? 'IA'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Agente IA</DropdownMenuLabel>
            <DropdownMenuItem onClick={ativarIaPadrao} disabled={!agentePadrao}>
              Ativar IA {agentePadrao ? `(${agentePadrao.nome})` : ''}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAgente(null)} disabled={!iaAtiva}>
              Desativar IA
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {agentesAtivos.map((a) => (
              <DropdownMenuItem key={a.id} onClick={() => setAgente(a.id)}>
                {a.nome}
                {a.id === agentePadrao?.id ? ' (padrão)' : ''}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 bg-background/70 px-2 text-xs shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              Padrão
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => patch.mutate({ id: conversa.id, status: 'open', agente_ia_id: null })}
            >
              Modo humano
            </DropdownMenuItem>
            <DropdownMenuItem onClick={ativarIaPadrao} disabled={!agentePadrao}>
              Modo IA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => patch.mutate({ id: conversa.id, status: 'pending' })}>
              Aguardando atendimento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refresh} title="Atualizar">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        <OcConversaAutomacoesMenu conversaId={conversa.id} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 bg-background/70 px-2 text-xs shadow-sm">
              <UserRound className="h-3.5 w-3.5" />
              Atribuir
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Atribuir a</DropdownMenuLabel>
            {currentUserId && (
              <DropdownMenuItem onClick={() => assignTo(String(currentUserId))}>
                Eu mesmo
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {membrosAtribuicao.length === 0 ? (
              <DropdownMenuItem disabled>Nenhum outro membro na clínica</DropdownMenuItem>
            ) : (
              membrosAtribuicao.map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => assignTo(u.id)}>
                  {u.nome}
                  {u.email ? (
                    <span className="ml-1 text-muted-foreground">({u.email})</span>
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <PipelineMoveMenu conversa={conversa} pipelines={pipelines} />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 bg-background/70 px-2 text-xs shadow-sm"
          onClick={() =>
            encerrar.mutate(conversa.id, {
              onSuccess: () => toast.success('Conversa encerrada'),
              onError: () => toast.error('Não foi possível encerrar a conversa'),
            })
          }
          disabled={encerrar.isPending}
        >
          <CircleX className="h-3.5 w-3.5" />
          Encerrar
        </Button>
          </>
        )}
      </div>
    </div>
  );
}

function PipelineMoveMenu({
  conversa,
  pipelines,
}: {
  conversa: OcConversa;
  pipelines: { id: string; nome: string }[];
}) {
  const qc = useQueryClient();
  const criarCard = useOcCardCreate();
  const patchCard = useOcCardPatch();
  const pipelineCard = conversa.pipeline_card;
  const defaultPipeline =
    pipelines.find((p) => p.nome === 'Atendimento WhatsApp') ?? pipelines[0];
  const pipelineId = pipelineCard?.pipeline_id ?? defaultPipeline?.id;

  const { data: stages = [], isLoading } = useOcStagesQuery(pipelineId ?? null);

  const moveToStage = (stage: OcPipelineStage) => {
    if (!pipelineId) {
      toast.error('Nenhum pipeline configurado');
      return;
    }

    if (pipelineCard) {
      patchCard.mutate(
        {
          id: pipelineCard.card_id,
          pipelineId,
          stage_id: stage.id,
        },
        {
          onSuccess: () => {
            toast.success(`Movido para ${stage.nome}`);
            qc.invalidateQueries({ queryKey: ['oc', 'conversa', conversa.id] });
            qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
          },
          onError: () => toast.error('Não foi possível mover no pipeline'),
        },
      );
      return;
    }

    criarCard.mutate(
      {
        pipelineId,
        stage_id: stage.id,
        conversa_id: conversa.id,
        titulo: conversa.contato?.nome ?? 'Conversa',
      },
      {
        onSuccess: () => {
          toast.success(`Adicionado em ${stage.nome}`);
          qc.invalidateQueries({ queryKey: ['oc', 'conversa', conversa.id] });
          qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
        },
        onError: () => toast.error('Não foi possível adicionar ao pipeline'),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 bg-background/70 px-2 text-xs shadow-sm">
          <ListTree className="h-3.5 w-3.5" />
          {pipelineCard ? 'Mover no pipeline' : 'Pipeline'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        <DropdownMenuLabel>
          {pipelineCard ? `Estágio: ${pipelineCard.stage_nome}` : 'Adicionar ao pipeline'}
        </DropdownMenuLabel>
        {!pipelineId ? (
          <DropdownMenuItem disabled>Nenhum pipeline</DropdownMenuItem>
        ) : isLoading ? (
          <DropdownMenuItem disabled>Carregando estágios…</DropdownMenuItem>
        ) : (
          stages.map((s) => (
            <DropdownMenuItem
              key={s.id}
              disabled={pipelineCard?.stage_id === s.id}
              onClick={() => moveToStage(s)}
            >
              {s.tipo === 'ganho' && <Trophy className="mr-1.5 h-3.5 w-3.5 text-green-600" />}
              {s.nome}
              {pipelineCard?.stage_id === s.id ? ' (atual)' : ''}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
