import type { Edge, Node } from '@xyflow/react';
import type { OcAgente } from '@/features/omnichannel/types';

export const AGENTE_NODE_WIDTH = 300;
export const AGENTE_NODE_HEIGHT = 172;

/** Rótulo de departamento: campo dedicado ou categoria como fallback legado. */
export function getAgenteDepartamento(agente: OcAgente): string | null {
  const raw = agente.departamento?.trim() || agente.categoria?.trim();
  return raw || null;
}

export function normalizeDepartamentoKey(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR');
}

export type DepartamentoFiltro = {
  key: string;
  label: string;
  count: number;
};

export function getDepartamentos(agentes: OcAgente[]): DepartamentoFiltro[] {
  const map = new Map<string, { label: string; count: number }>();

  for (const a of agentes) {
    const label = getAgenteDepartamento(a);
    if (!label) continue;
    const key = normalizeDepartamentoKey(label);
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(key, { label, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([key, { label, count }]) => ({ key, label, count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function agenteMatchesDepartamento(agente: OcAgente, deptKey: string): boolean {
  const label = getAgenteDepartamento(agente);
  return !!label && normalizeDepartamentoKey(label) === deptKey;
}

export function filterAgentesPorDepartamento(
  agentes: OcAgente[],
  deptKey: string | null,
): OcAgente[] {
  if (!deptKey) return agentes;

  const byId = new Map(agentes.map((a) => [a.id, a]));
  const children = new Map<string, string[]>();

  for (const a of agentes) {
    if (a.parent_id && byId.has(a.parent_id)) {
      const list = children.get(a.parent_id) ?? [];
      list.push(a.id);
      children.set(a.parent_id, list);
    }
  }

  const matched = new Set(
    agentes.filter((a) => agenteMatchesDepartamento(a, deptKey)).map((a) => a.id),
  );

  if (matched.size === 0) return [];

  const visible = new Set(matched);

  // Ancestrais (chefe direto / cadeia acima)
  for (const id of matched) {
    let cur = byId.get(id);
    while (cur?.parent_id && byId.has(cur.parent_id)) {
      visible.add(cur.parent_id);
      cur = byId.get(cur.parent_id);
    }
  }

  // Descendentes (equipe abaixo dos agentes do departamento)
  const stack = [...matched];
  while (stack.length > 0) {
    const id = stack.pop()!;
    for (const childId of children.get(id) ?? []) {
      if (!visible.has(childId)) {
        visible.add(childId);
        stack.push(childId);
      }
    }
  }

  return agentes.filter((a) => visible.has(a.id));
}

export function wouldCreateCycle(
  agentes: OcAgente[],
  childId: string,
  newParentId: string,
): boolean {
  if (childId === newParentId) return true;
  let current: string | undefined = newParentId;
  while (current) {
    if (current === childId) return true;
    const parent = agentes.find((a) => a.id === current);
    current = parent?.parent_id ?? undefined;
  }
  return false;
}

function subtreeWidth(agent: OcAgente, children: Map<string, OcAgente[]>): number {
  const kids = children.get(agent.id) ?? [];
  if (kids.length === 0) return AGENTE_NODE_WIDTH;
  return (
    kids.map((k) => subtreeWidth(k, children)).reduce((a, b) => a + b, 0) +
    48 * Math.max(0, kids.length - 1)
  );
}

export function buildOrganogramGraph(agentes: OcAgente[]): { nodes: Node[]; edges: Edge[] } {
  if (agentes.length === 0) return { nodes: [], edges: [] };

  const ids = new Set(agentes.map((a) => a.id));
  const children = new Map<string, OcAgente[]>();

  for (const a of agentes) {
    if (a.parent_id && ids.has(a.parent_id)) {
      const list = children.get(a.parent_id) ?? [];
      list.push(a);
      children.set(a.parent_id, list);
    }
  }

  for (const [, list] of children) {
    list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  const roots = agentes
    .filter((a) => !a.parent_id || !ids.has(a.parent_id))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function place(agent: OcAgente, centerX: number, depth: number) {
    nodes.push({
      id: agent.id,
      type: 'agenteNode',
      position: {
        x: centerX - AGENTE_NODE_WIDTH / 2,
        y: depth * (AGENTE_NODE_HEIGHT + 88),
      },
      data: { agente: agent },
      draggable: true,
    });

    const kids = children.get(agent.id) ?? [];
    if (kids.length === 0) return;

    const totalW =
      kids.map((k) => subtreeWidth(k, children)).reduce((a, b) => a + b, 0) +
      48 * Math.max(0, kids.length - 1);

    let cursor = centerX - totalW / 2;
    for (const kid of kids) {
      const w = subtreeWidth(kid, children);
      const kidCenter = cursor + w / 2;
      edges.push({
        id: `e-${agent.id}-${kid.id}`,
        source: agent.id,
        target: kid.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
      place(kid, kidCenter, depth + 1);
      cursor += w + 48;
    }
  }

  let offset = 0;
  for (const root of roots) {
    const w = subtreeWidth(root, children);
    place(root, offset + w / 2, 0);
    offset += w + 96;
  }

  return { nodes, edges };
}
