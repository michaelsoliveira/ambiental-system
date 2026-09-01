import type { OcAgente } from '../types';

/** Primeiro agente ativo na ordem do backend: orquestrador → worker → qualquer. */
export function pickDefaultOcAgente(agentes: OcAgente[]): OcAgente | null {
  const ativos = agentes.filter((a) => a.ativo);
  if (!ativos.length) return null;

  const orchestrator = ativos.find((a) => a.tipo === 'orchestrator');
  if (orchestrator) return orchestrator;

  const worker = ativos.find((a) => a.tipo === 'worker');
  if (worker) return worker;

  return ativos[0] ?? null;
}
