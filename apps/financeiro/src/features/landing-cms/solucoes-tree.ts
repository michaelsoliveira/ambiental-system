/**
 * Espelho leve de ambiental-landing/src/lib/content/solucoes-tree.ts
 * (repos separados — manter max depth alinhado).
 */

export const SOLUCAO_MAX_DEPTH = 3;

export type SolucaoLike = {
  id: string;
  titulo?: string;
  parentId?: string;
};

export function getSolucaoDepth(items: SolucaoLike[], id: string): number {
  const byId = new Map(items.map((i) => [i.id, i]));
  let depth = 1;
  let current = byId.get(id);
  const seen = new Set<string>();
  while (current?.parentId && byId.has(current.parentId)) {
    if (seen.has(current.id)) return Number.POSITIVE_INFINITY;
    seen.add(current.id);
    depth += 1;
    current = byId.get(current.parentId);
  }
  return depth;
}

export function getSolucaoAncestors(
  items: SolucaoLike[],
  id: string,
): SolucaoLike[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const chain: SolucaoLike[] = [];
  let current = byId.get(id);
  const seen = new Set<string>();
  while (current?.parentId && byId.has(current.parentId)) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    const parent = byId.get(current.parentId)!;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function getSolucaoPathLabel(
  items: SolucaoLike[],
  id: string,
  separator = " › ",
): string {
  const item = items.find((i) => i.id === id);
  if (!item) return id;
  const path = [...getSolucaoAncestors(items, id), item];
  return path.map((p) => p.titulo || p.id).join(separator);
}

/** Pais válidos: profundidade do pai < SOLUCAO_MAX_DEPTH (filho cabe). */
export function canBeParentOf(
  items: SolucaoLike[],
  parentId: string,
  childId?: string,
): boolean {
  if (childId && parentId === childId) return false;
  // Impede ciclo: parentId não pode ser descendente do child
  if (childId) {
    const ancestorsOfParent = getSolucaoAncestors(items, parentId).map((a) => a.id);
    if (ancestorsOfParent.includes(childId)) return false;
  }
  const parentDepth = getSolucaoDepth(items, parentId);
  if (!Number.isFinite(parentDepth)) return false;
  return parentDepth < SOLUCAO_MAX_DEPTH;
}

export function flattenForSelect(items: SolucaoLike[]): {
  id: string;
  label: string;
  depth: number;
}[] {
  const ids = new Set(items.map((i) => i.id).filter(Boolean));
  const roots = items.filter(
    (i) => i.id && (!i.parentId || i.parentId === i.id || !ids.has(i.parentId)),
  );

  const out: { id: string; label: string; depth: number }[] = [];

  function walk(node: SolucaoLike, depth: number, prefix: string[]) {
    const path = [...prefix, node.titulo || node.id];
    out.push({ id: node.id, label: path.join(" › "), depth });
    if (depth >= SOLUCAO_MAX_DEPTH) return;
    for (const child of items.filter((i) => i.parentId === node.id && i.id)) {
      walk(child, depth + 1, path);
    }
  }

  for (const root of roots) {
    walk(root, 1, []);
  }
  return out;
}
