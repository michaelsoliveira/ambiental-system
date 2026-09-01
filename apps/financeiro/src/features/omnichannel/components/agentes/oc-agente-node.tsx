'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Power, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OcAgente } from '@/features/omnichannel/types';
import { getAgenteDepartamento } from './oc-agentes-layout';

export type AgenteNodeData = {
  agente: OcAgente;
  onDelete?: (id: string) => void;
  /** Agente visível por contexto (ancestral), mas fora do departamento filtrado */
  dimmed?: boolean;
};

function OcAgenteNodeComponent({ data, selected }: NodeProps) {
  const { agente, onDelete, dimmed } = data as AgenteNodeData;
  const isOrch = agente.tipo === 'orchestrator';
  const deptLabel = getAgenteDepartamento(agente);

  return (
    <div
      className={cn(
        'w-[300px] cursor-pointer rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        !agente.ativo && 'opacity-70',
        dimmed && 'opacity-55',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-2.5 !w-2.5 !border-2 !border-slate-300 !bg-white"
      />

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="truncate text-sm font-semibold">{agente.nome}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {agente.ativo ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <Power className="h-3 w-3" />
                Ativo
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Inativo</span>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(agente.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {isOrch ? 'Orquestrador' : 'Worker'}
          </Badge>
          {deptLabel && (
            <Badge className="bg-blue-100 text-[10px] uppercase text-blue-700 hover:bg-blue-100">
              {deptLabel}
            </Badge>
          )}
          {agente.categoria && (
            <Badge variant="secondary" className="text-[10px]">
              {agente.categoria}
            </Badge>
          )}
        </div>

        <p className="mt-2 truncate text-[11px] text-muted-foreground">{agente.modelo}</p>
        {agente.descricao && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{agente.descricao}</p>
        )}

        <p className="mt-2.5 text-[10px] text-muted-foreground/80">
          {isOrch ? 'Orquestrador' : 'Worker'} · autonomous
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2.5 !w-2.5 !border-2 !border-slate-300 !bg-white"
      />
    </div>
  );
}

export const OcAgenteNode = memo(OcAgenteNodeComponent);
