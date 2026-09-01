'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
  addEdge,
  getNodesBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { OcAgente } from '@/features/omnichannel/types';
import { useOcAgenteDelete, useOcAgentePatch } from '@/features/omnichannel/hooks/use-oc-api';
import { OcAgenteNode, type AgenteNodeData } from './oc-agente-node';
import {
  agenteMatchesDepartamento,
  buildOrganogramGraph,
  filterAgentesPorDepartamento,
  getDepartamentos,
  wouldCreateCycle,
} from './oc-agentes-layout';

const nodeTypes = { agenteNode: OcAgenteNode };

const INITIAL_ZOOM = 0.9;
const VIEWPORT_ANIMATION_MS = 450;

function centerViewportAtZoom(
  instance: ReactFlowInstance,
  layoutNodes: Node[],
  duration = VIEWPORT_ANIMATION_MS,
) {
  if (layoutNodes.length === 0) return;
  const bounds = getNodesBounds(layoutNodes);
  instance.setCenter(150 + bounds.x + bounds.width / 2, 100 + bounds.y + bounds.height / 2, {
    zoom: INITIAL_ZOOM,
    duration,
  });
}

type Props = {
  agentes: OcAgente[];
  isLoading?: boolean;
  onAgentEdit?: (agente: OcAgente) => void;
};

export function OcAgentesOrganograma({ agentes, isLoading, onAgentEdit }: Props) {
  const patch = useOcAgentePatch();
  const deletar = useOcAgenteDelete();
  const [departamentoKey, setDepartamentoKey] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const departamentos = useMemo(() => getDepartamentos(agentes), [agentes]);

  const departamentoKeyValido = useMemo(() => {
    if (!departamentoKey) return null;
    return departamentos.some((d) => d.key === departamentoKey) ? departamentoKey : null;
  }, [departamentoKey, departamentos]);

  const visiveis = useMemo(
    () => filterAgentesPorDepartamento(agentes, departamentoKeyValido),
    [agentes, departamentoKeyValido],
  );

  /** Hierarquia / filtro — dispara relayout completo */
  const layoutKey = useMemo(
    () =>
      `${departamentoKeyValido ?? 'all'}::${visiveis
        .map((a) => `${a.id}:${a.parent_id ?? ''}`)
        .sort()
        .join('|')}`,
    [visiveis, departamentoKeyValido],
  );

  /** Campos exibidos no card — atualiza dados sem relayout */
  const agentesDataKey = useMemo(
    () =>
      visiveis
        .map(
          (a) =>
            `${a.id}:${a.modelo}:${a.nome}:${a.ativo}:${a.tipo}:${a.descricao ?? ''}:${a.departamento ?? ''}:${a.categoria ?? ''}`,
        )
        .sort()
        .join('|'),
    [visiveis],
  );

  const deleteMutateRef = useRef(deletar.mutate);
  deleteMutateRef.current = deletar.mutate;

  const onDeleteAgent = useCallback((id: string) => {
    if (!confirm('Excluir este agente? Subordinados ficarão sem chefe direto.')) return;
    deleteMutateRef.current(id);
  }, []);

  const flowRef = useRef<ReactFlowInstance | null>(null);
  const layoutNodesRef = useRef<Node[]>([]);
  const centerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visiveisRef = useRef(visiveis);
  visiveisRef.current = visiveis;

  const scheduleViewportCenter = useCallback((duration = VIEWPORT_ANIMATION_MS) => {
    if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    centerTimerRef.current = setTimeout(() => {
      centerTimerRef.current = null;
      const instance = flowRef.current;
      const layoutNodes = layoutNodesRef.current;
      if (!instance || layoutNodes.length === 0) return;
      centerViewportAtZoom(instance, layoutNodes, duration);
    }, 32);
  }, []);

  useEffect(() => {
    const { nodes: layoutNodes, edges: layoutEdges } = buildOrganogramGraph(visiveisRef.current);
    layoutNodesRef.current = layoutNodes;
    setNodes(
      layoutNodes.map((n) => {
        const agente = (n.data as AgenteNodeData).agente;
        const dimmed =
          !!departamentoKeyValido && !agenteMatchesDepartamento(agente, departamentoKeyValido);
        return {
          ...n,
          data: {
            agente,
            onDelete: onDeleteAgent,
            dimmed,
          },
        };
      }),
    );
    setEdges(layoutEdges);
    scheduleViewportCenter();
  }, [layoutKey, departamentoKeyValido, onDeleteAgent, setNodes, setEdges, scheduleViewportCenter]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const fresh = visiveis.find((a) => a.id === n.id);
        if (!fresh) return n;
        const dimmed =
          !!departamentoKeyValido && !agenteMatchesDepartamento(fresh, departamentoKeyValido);
        return {
          ...n,
          data: {
            ...(n.data as AgenteNodeData),
            agente: fresh,
            dimmed,
            onDelete: onDeleteAgent,
          },
        };
      }),
    );
  }, [agentesDataKey, departamentoKeyValido, onDeleteAgent, visiveis, setNodes]);

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      flowRef.current = instance;
      scheduleViewportCenter();
    },
    [scheduleViewportCenter],
  );

  useEffect(
    () => () => {
      if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    },
    [],
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if ((event.target as HTMLElement).closest('button')) return;
      const agente = agentes.find((a) => a.id === node.id) ?? (node.data as AgenteNodeData).agente;
      onAgentEdit?.(agente);
    },
    [onAgentEdit, agentes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;

      if (wouldCreateCycle(agentes, target, source)) {
        toast.error('Ligação inválida: criaria um ciclo na hierarquia.');
        return;
      }

      patch.mutate(
        { id: target, parent_id: source },
        {
          onSuccess: () => {
            setEdges((eds) =>
              addEdge(
                {
                  ...connection,
                  id: `e-${source}-${target}`,
                  type: 'smoothstep',
                  sourceHandle: 'bottom',
                  targetHandle: 'top',
                  style: { stroke: '#94a3b8', strokeWidth: 2 },
                },
                eds.filter((e) => e.target !== target),
              ),
            );
            toast.success('Hierarquia atualizada');
          },
        },
      );
    },
    [agentes, patch, setEdges],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const edge of deleted) {
        if (!edge.target) continue;
        patch.mutate({ id: edge.target, parent_id: null });
      }
    },
    [patch],
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center text-sm text-muted-foreground">
        Carregando organograma…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">Departamento:</span>
        <button
          type="button"
          onClick={() => setDepartamentoKey(null)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            departamentoKeyValido === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          Todos
        </button>
        {departamentos.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDepartamentoKey(d.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium uppercase transition-colors',
              departamentoKeyValido === d.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {d.label}
            <span className="ml-1 opacity-70">({d.count})</span>
          </button>
        ))}
        {departamentos.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Preencha o campo Departamento ao criar agentes para filtrar por time.
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {visiveis.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {departamentoKeyValido
              ? 'Nenhum agente neste departamento.'
              : 'Nenhum agente ainda. Crie o primeiro com "Novo agente".'}
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onInit={onInit}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            minZoom={0.25}
            maxZoom={1.5}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-muted/20"
          >
            <Background gap={16} size={1} color="#cbd5e1" />
            <Controls
              showInteractive={false}
              className="!rounded-lg !border !border-border !bg-background !shadow-sm"
            />
            <MiniMap
              zoomable
              pannable
              className="!rounded-lg !border !border-border !bg-background"
              nodeColor={(n) => ((n.data as AgenteNodeData)?.agente?.ativo ? '#3b82f6' : '#94a3b8')}
            />
            <Panel position="top-left" className="m-0 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
              Clique no card para editar · arraste nós · conecte de baixo→cima para definir chefe
            </Panel>
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
