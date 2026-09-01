import type { OcPipelineStage, TipoStage } from '@/features/omnichannel/types';

export const STAGE_BG: Record<string, string> = {
  zinc: 'bg-zinc-100',
  gray: 'bg-zinc-100',
  blue: 'bg-blue-50',
  amber: 'bg-amber-50',
  green: 'bg-green-50',
  red: 'bg-red-50',
};

export const STAGE_HEADER_BORDER: Record<TipoStage, string> = {
  normal: 'border-zinc-300',
  ganho: 'border-green-500',
  perdido: 'border-red-500',
};

export function stageBackground(stage: OcPipelineStage): string {
  return STAGE_BG[stage.cor] ?? STAGE_BG.zinc;
}

export function stageLabel(stage: OcPipelineStage): string {
  return stage.nome.toUpperCase();
}

const PINNED_KEY = 'oc-pipelines-pinned';

export function getPinnedPipelineIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function togglePinnedPipeline(id: string): string[] {
  const current = getPinnedPipelineIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  return next;
}
