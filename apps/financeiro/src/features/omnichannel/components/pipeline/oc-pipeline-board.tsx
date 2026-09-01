'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, GitBranch, GripVertical, Plus, Settings2, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useOcCardsQuery,
  useOcCardPatch,
  useOcPipelineQuery,
  useOcPipelinesQuery,
  useOcStagesQuery,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { OcPipelineCard, OcPipelineStage, TipoStage } from '@/features/omnichannel/types';
import { OcPipelineAddCardDialog } from './oc-pipeline-add-card-dialog';
import { OcPipelineStagesDialog } from './oc-pipeline-stages-dialog';
import { STAGE_HEADER_BORDER, stageBackground } from './oc-pipeline-utils';

const stageDropId = (stageId: string) => `stage:${stageId}`;
const pipelineDropId = (pipelineId: string) => `pipeline:${pipelineId}`;

function parseDropTarget(id: string): { type: 'stage' | 'pipeline'; id: string } | null {
  if (id.startsWith('stage:')) return { type: 'stage', id: id.slice(6) };
  if (id.startsWith('pipeline:')) return { type: 'pipeline', id: id.slice(9) };
  return null;
}

function KanbanCardContent({
  card,
  stages,
  pipelineId,
  dragging = false,
}: {
  card: OcPipelineCard;
  stages: OcPipelineStage[];
  pipelineId: string;
  dragging?: boolean;
}) {
  const { slug } = useOcBasePath();
  const patch = useOcCardPatch();

  return (
    <div
      className={cn(
        'rounded-md border bg-background p-3 text-sm shadow-sm',
        dragging && 'opacity-90 ring-2 ring-primary/30',
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
        <div className="min-w-0 flex-1">
          {card.conversa_id ? (
            <Link
              href={`/org/${slug}/omnichannel/inbox?conversa=${card.conversa_id}`}
              className="font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {card.titulo || 'Conversa vinculada'}
            </Link>
          ) : (
            <p className="font-medium">{card.titulo || 'Sem título'}</p>
          )}
          {card.valor_estimado != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              R$ {card.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
          <Select
            value={card.stage_id}
            onValueChange={(stageId) => patch.mutate({ id: card.id, pipelineId, stage_id: stageId })}
          >
            <SelectTrigger className="mt-2 h-7 text-xs" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function DraggableKanbanCard({
  card,
  stages,
  pipelineId,
}: {
  card: OcPipelineCard;
  stages: OcPipelineStage[];
  pipelineId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card, pipelineId },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-40')}
      {...listeners}
      {...attributes}
    >
      <KanbanCardContent card={card} stages={stages} pipelineId={pipelineId} dragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  stage,
  cards,
  pipelineId,
  stages,
}: {
  stage: OcPipelineStage;
  cards: OcPipelineCard[];
  pipelineId: string;
  stages: OcPipelineStage[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const tipo = stage.tipo as TipoStage;
  const { setNodeRef, isOver } = useDroppable({ id: stageDropId(stage.id) });

  return (
    <>
      <div
        className={cn(
          'flex w-64 shrink-0 flex-col rounded-lg border',
          stageBackground(stage),
          isOver && 'ring-2 ring-primary/40',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b-2 px-3 py-2.5',
            STAGE_HEADER_BORDER[tipo],
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {tipo === 'ganho' && <Trophy className="h-3.5 w-3.5 shrink-0 text-green-600" />}
            {tipo === 'perdido' && <X className="h-3.5 w-3.5 shrink-0 text-red-600" />}
            <span className="truncate text-xs font-semibold tracking-wide">{stage.nome.toUpperCase()}</span>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {cards.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setAddOpen(true)}
            aria-label={`Adicionar em ${stage.nome}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div ref={setNodeRef} className="min-h-[120px] flex-1 space-y-2 p-2">
          {cards.length === 0 ? (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              Arraste cards aqui ou click no + pra adicionar.
            </p>
          ) : (
            cards.map((card) => (
              <DraggableKanbanCard
                key={card.id}
                card={card}
                stages={stages}
                pipelineId={pipelineId}
              />
            ))
          )}
        </div>
      </div>

      <OcPipelineAddCardDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        pipelineId={pipelineId}
        stage={stage}
      />
    </>
  );
}

function PipelineDropTab({
  id,
  nome,
  active,
}: {
  id: string;
  nome: string;
  active: boolean;
}) {
  const { slug } = useOcBasePath();
  const router = useRouter();
  const { setNodeRef, isOver } = useDroppable({ id: pipelineDropId(id) });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => router.push(`/org/${slug}/omnichannel/pipelines/${id}`)}
      className={cn(
        'shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isOver && !active && 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30',
      )}
    >
      {nome}
    </button>
  );
}

type Props = {
  pipelineId: string;
};

export function OcPipelineBoard({ pipelineId }: Props) {
  const { slug } = useOcBasePath();

  const router = useRouter();
  const { data: pipeline } = useOcPipelineQuery(pipelineId);
  const { data: pipelines = [] } = useOcPipelinesQuery();
  const { data: stages = [] } = useOcStagesQuery(pipelineId);
  const { data: cards = [] } = useOcCardsQuery(pipelineId);
  const patch = useOcCardPatch();
  const [stagesOpen, setStagesOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<OcPipelineCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);

    const { active, over } = event;
    if (!over || typeof over.id !== 'string') return;

    const cardId = String(active.id);
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const target = parseDropTarget(over.id);
    if (!target) return;

    if (target.type === 'stage') {
      if (target.id === card.stage_id) return;
      patch.mutate({ id: cardId, pipelineId, stage_id: target.id });
      return;
    }

    if (target.type === 'pipeline' && target.id !== pipelineId) {
      patch.mutate(
        {
          id: cardId,
          pipelineId: target.id,
          sourcePipelineId: pipelineId,
          pipeline_id: target.id,
        },
        {
          onSuccess: () => {
            router.push(`/org/${slug}/omnichannel/pipelines/${target.id}`);
          },
        },
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                <Link href={`/org/${slug}/omnichannel/pipelines`} aria-label="Voltar">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h1 className="truncate font-semibold">{pipeline?.nome ?? 'Pipeline'}</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStagesOpen(true)}>
              <Settings2 className="mr-2 h-3.5 w-3.5" />
              Configurar stages
            </Button>
          </div>

          {pipelines.length > 1 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-xs text-muted-foreground">Mover para:</span>
              {pipelines.map((p) => (
                <PipelineDropTab
                  key={p.id}
                  id={p.id}
                  nome={p.nome}
                  active={p.id === pipelineId}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-x-auto p-4 md:p-6">
          <div className="flex min-h-full gap-4">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                pipelineId={pipelineId}
                stages={stages}
                cards={cards.filter((c) => c.stage_id === stage.id)}
              />
            ))}
            {stages.length === 0 && (
              <div className="flex h-40 w-full items-center justify-center text-sm text-muted-foreground">
                Carregando stages…
              </div>
            )}
          </div>
        </div>

        <OcPipelineStagesDialog
          open={stagesOpen}
          onOpenChange={setStagesOpen}
          pipelineId={pipelineId}
          stages={stages}
        />
      </div>

      <DragOverlay>
        {activeCard ? (
          <KanbanCardContent
            card={activeCard}
            stages={stages}
            pipelineId={pipelineId}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
