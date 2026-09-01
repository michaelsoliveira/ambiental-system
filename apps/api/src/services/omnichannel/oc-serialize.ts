import type {
  OcAgente,
  OcAutomacao,
  OcCanal,
  OcConfigIA,
  OcContato,
  OcConversa,
  OcExecucao,
  OcInbox,
  OcMensagem,
  OcPipeline,
  OcPipelineCard,
  OcPipelineStage,
  OcSkill,
  OcTag,
  OcTool,
  OcWatchdogConfig,
} from '@prisma/client'
import { Prisma } from '@prisma/client'

function iso(value: Date | string | null | undefined): string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function formatPhoneBr(telefone?: string | null): string | undefined {
  if (!telefone) return undefined
  const digits = telefone.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4)
    const rest = digits.slice(4)
    if (rest.length === 9) return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    if (rest.length === 8) return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return telefone
}

export function serializeCanal(canal: OcCanal) {
  const config = asRecord(canal.config)
  return {
    id: canal.id,
    nome: canal.nome,
    tipo: canal.tipo,
    ativo: canal.ativo,
    ia_habilitada: canal.ia_habilitada,
    config,
    created_at: iso(canal.created_at)!,
    provider: typeof config.provider === 'string' ? config.provider : undefined,
    instance_status:
      typeof config.instance_status === 'string' ? config.instance_status : undefined,
    phone: typeof config.phone === 'string' ? config.phone : undefined,
    sync_error: typeof config.sync_error === 'string' ? config.sync_error : undefined,
  }
}

export function serializeContato(contato: OcContato) {
  return {
    id: contato.id,
    nome: contato.nome ?? undefined,
    telefone: contato.telefone ?? undefined,
    telefone_formatado: formatPhoneBr(contato.telefone),
    email: contato.email ?? undefined,
    avatar_url: contato.avatar_url ?? undefined,
    tags: contato.tags ?? [],
    created_at: iso(contato.created_at)!,
  }
}

export function serializeMensagem(mensagem: OcMensagem) {
  const extra = asRecord(mensagem.extra_data)
  const media = asRecord(extra.media)
  // Não vazar base64 enorme no JSON da listagem — frontend busca via /media
  if (media.base64_inline) {
    const { base64_inline: _drop, ...mediaRest } = media
    extra.media = { ...mediaRest, has_inline: true }
  }
  return {
    id: mensagem.id,
    autor_tipo: mensagem.autor_tipo,
    autor_id: mensagem.autor_id ?? undefined,
    tipo: mensagem.tipo,
    conteudo: mensagem.conteudo,
    canal_msg_id: mensagem.canal_msg_id ?? undefined,
    is_read: mensagem.is_read,
    extra_data: extra,
    created_at: iso(mensagem.created_at)!,
  }
}

export function serializeAgente(agente: OcAgente, detail = false) {
  const base = {
    id: agente.id,
    nome: agente.nome,
    descricao: agente.descricao ?? undefined,
    tipo: agente.tipo,
    categoria: agente.categoria ?? undefined,
    modelo: agente.modelo,
    temperatura: agente.temperatura,
    ativo: agente.ativo,
    parent_id: agente.parent_id ?? null,
    departamento: agente.departamento ?? undefined,
    squad: agente.squad ?? undefined,
    max_tokens: agente.max_tokens,
    timeout_ms: agente.timeout_ms,
    created_at: iso(agente.created_at)!,
  }
  if (!detail) return base
  return {
    ...base,
    system_prompt: agente.system_prompt,
    contexto_operacional: agente.contexto_operacional ?? undefined,
  }
}

export function serializeSkill(skill: OcSkill) {
  return {
    id: skill.id,
    nome: skill.nome,
    categoria: skill.categoria ?? undefined,
    descricao_llm: skill.descricao_llm,
    tool_id: skill.tool_id ?? undefined,
    parameters_schema: asRecord(skill.parameters_schema),
    invocation_config: asRecord(skill.invocation_config),
    instrucoes_extras: skill.instrucoes_extras ?? undefined,
    timeout_ms: skill.timeout_ms,
    versao: skill.versao,
    ativo: skill.ativo,
    created_at: iso(skill.created_at)!,
  }
}

export function serializeTool(tool: OcTool) {
  return {
    id: tool.id,
    nome: tool.nome,
    descricao: tool.descricao ?? undefined,
    tipo: tool.tipo,
    config: asRecord(tool.config),
    created_at: iso(tool.created_at)!,
  }
}

export function serializeExecucao(execucao: OcExecucao) {
  return {
    id: execucao.id,
    conversa_id: execucao.conversa_id ?? undefined,
    agente_id: execucao.agente_id ?? undefined,
    skill_id: execucao.skill_id ?? undefined,
    status: execucao.status,
    error_msg: execucao.error_msg ?? undefined,
    tokens_input: execucao.tokens_input ?? undefined,
    tokens_output: execucao.tokens_output ?? undefined,
    duration_ms: execucao.duration_ms ?? undefined,
    started_at: iso(execucao.started_at)!,
    finished_at: iso(execucao.finished_at),
  }
}

export function serializePipeline(
  pipeline: OcPipeline,
  counts?: { stages_count?: number; cards_count?: number },
) {
  return {
    id: pipeline.id,
    nome: pipeline.nome,
    created_at: iso(pipeline.created_at)!,
    stages_count: counts?.stages_count,
    cards_count: counts?.cards_count,
  }
}

export function serializeStage(stage: OcPipelineStage) {
  return {
    id: stage.id,
    nome: stage.nome,
    tipo: stage.tipo,
    cor: stage.cor,
    ordem: stage.ordem,
  }
}

export function serializeCard(card: OcPipelineCard) {
  return {
    id: card.id,
    stage_id: card.stage_id,
    conversa_id: card.conversa_id ?? undefined,
    titulo: card.titulo ?? undefined,
    valor_estimado:
      card.valor_estimado == null
        ? undefined
        : Number(card.valor_estimado),
    won: card.won,
    lost: card.lost,
    created_at: iso(card.created_at)!,
  }
}

export function serializeAutomacao(automacao: OcAutomacao) {
  return {
    id: automacao.id,
    nome: automacao.nome,
    descricao: automacao.descricao ?? undefined,
    trigger_tipo: automacao.trigger_tipo,
    condicoes: asArray(automacao.condicoes) as Record<string, unknown>[],
    acoes: asArray(automacao.acoes) as Record<string, unknown>[],
    ativa: automacao.ativa,
    limite_rpm: automacao.limite_rpm,
    created_at: iso(automacao.created_at)!,
  }
}

export function serializeInbox(inbox: OcInbox) {
  return {
    id: inbox.id,
    nome: inbox.nome,
    icone: inbox.icone,
    cor: inbox.cor,
    filtros: asRecord(inbox.filtros),
    ordem: inbox.ordem,
    created_at: iso(inbox.created_at)!,
  }
}

export function serializeTag(tag: OcTag) {
  return {
    id: tag.id,
    nome: tag.nome,
    cor: tag.cor,
  }
}

export function serializeWatchdog(cfg: OcWatchdogConfig) {
  return {
    habilitado: cfg.habilitado,
    threshold_bot_min: cfg.threshold_bot_min,
    threshold_pending_min: cfg.threshold_pending_min,
    threshold_open_min: cfg.threshold_open_min,
    max_tentativas: cfg.max_tentativas,
    horario_24h: cfg.horario_24h,
  }
}

export function serializeConfigIA(cfg: OcConfigIA) {
  return {
    ia_habilitada: cfg.ia_habilitada,
    pausar_ia_humano_responde: cfg.pausar_ia_humano_responde,
    atendimento_24h: cfg.atendimento_24h,
    horario_config: asRecord(cfg.horario_config),
    mensagem_fora_horario: cfg.mensagem_fora_horario ?? undefined,
    contexto_negocio: cfg.contexto_negocio ?? undefined,
    limite_tokens_mes: cfg.limite_tokens_mes ?? undefined,
    dominios_permitidos: cfg.dominios_permitidos ?? [],
    handoff_keywords: asArray(cfg.handoff_keywords) as string[],
    resumo_modelo: cfg.resumo_modelo ?? undefined,
    timezone: cfg.timezone,
  }
}

export type PipelineCardSummary = {
  card_id: string
  pipeline_id: string
  pipeline_nome: string
  stage_id: string
  stage_nome: string
  stage_cor: string
  stage_tipo: string
}

export function serializeConversa(
  conversa: OcConversa & {
    contato?: OcContato | null
    canal?: OcCanal | null
  },
  extras?: {
    ultima_mensagem?: string | null
    nao_lidas?: number
    atendente_nome?: string | null
    pipeline_card?: PipelineCardSummary | null
  },
) {
  return {
    id: conversa.id,
    status: conversa.status,
    canal_id: conversa.canal_id,
    contato_id: conversa.contato_id,
    agente_ia_id: conversa.agente_ia_id ?? undefined,
    atendente_id: conversa.atendente_id ?? undefined,
    atendente_nome: extras?.atendente_nome ?? undefined,
    is_stuck: conversa.is_stuck,
    stuck_attempts: conversa.stuck_attempts,
    tags: conversa.tags ?? [],
    last_message_at: iso(conversa.last_message_at),
    first_response_at: iso(conversa.first_response_at),
    created_at: iso(conversa.created_at)!,
    closed_at: iso(conversa.closed_at),
    contato: conversa.contato ? serializeContato(conversa.contato) : undefined,
    canal: conversa.canal ? serializeCanal(conversa.canal) : undefined,
    ultima_mensagem: extras?.ultima_mensagem ?? undefined,
    nao_lidas: extras?.nao_lidas ?? 0,
    pipeline_card: extras?.pipeline_card ?? null,
    preferred_reply:
      asRecord(conversa.extra_data).preferred_reply === 'email' ||
      asRecord(conversa.extra_data).preferred_reply === 'whatsapp'
        ? (asRecord(conversa.extra_data).preferred_reply as 'email' | 'whatsapp')
        : undefined,
  }
}

export function toInputJson(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue
}
