export type TipoCanal =
  | 'whatsapp_evolution'
  | 'email'
  | 'webchat'
  | 'instagram'
  | 'telegram'
  | 'landing_form';
export type StatusConversa = 'bot' | 'pending' | 'open' | 'closed' | 'snoozed';
export type AutorTipo = 'contato' | 'agente' | 'humano' | 'system';
export type TipoAgente = 'worker' | 'orchestrator';
export type TipoTool = 'http_api' | 'sql_postgres' | 'internal';
export type StatusRun = 'running' | 'success' | 'error' | 'timeout';
export type TipoStage = 'normal' | 'ganho' | 'perdido';

export interface OcCanal {
  id: string;
  nome: string;
  tipo: TipoCanal;
  ativo: boolean;
  ia_habilitada: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export interface OcCanalListItem extends OcCanal {
  provider?: string;
  instance_status?: string;
  phone?: string;
  sync_error?: string;
  /** Canal landing_form — URL pública de ingestão */
  ingest_url?: string;
  /** Secret completo (só em create/get detalhe) */
  ingest_secret?: string;
  has_ingest_secret?: boolean;
}

export interface OcCanalQr {
  qrcode?: string | null;
  pairing_code?: string | null;
}

export interface OcCanalSyncResult {
  ok: boolean;
  status?: string;
  phone?: string;
  error?: string;
}

export interface OcCanalTestResult {
  ok: boolean;
  status?: string;
  message?: string;
}

export interface OcInboxFiltros {
  canal_ids?: string[];
  statuses?: string[];
  atribuicao?: string;
  tipo_conversa?: string;
  tags?: string[];
  /** @deprecated legado */
  status?: StatusConversa;
  /** @deprecated legado */
  canal_id?: string;
}

export interface OcInbox {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  filtros: OcInboxFiltros;
  ordem: number;
  created_at: string;
}

export interface OcContato {
  id: string;
  nome?: string;
  telefone?: string;
  telefone_formatado?: string;
  email?: string;
  avatar_url?: string;
  tags: string[];
  created_at: string;
}

export interface OcPipelineCardSummary {
  card_id: string;
  pipeline_id: string;
  pipeline_nome: string;
  stage_id: string;
  stage_nome: string;
  stage_cor: string;
  stage_tipo: TipoStage;
}

export interface OcConversa {
  id: string;
  status: StatusConversa;
  canal_id: string;
  contato_id: string;
  agente_ia_id?: string;
  atendente_id?: string;
  atendente_nome?: string;
  is_stuck: boolean;
  stuck_attempts: number;
  tags: string[];
  last_message_at?: string;
  first_response_at?: string;
  created_at: string;
  closed_at?: string;
  contato?: OcContato;
  canal?: OcCanal;
  ultima_mensagem?: string;
  nao_lidas?: number;
  pipeline_card?: OcPipelineCardSummary | null;
  /** Preferência de retorno (leads landing): e-mail ou WhatsApp */
  preferred_reply?: 'email' | 'whatsapp';
}

export interface OcMensagem {
  id: string;
  autor_tipo: AutorTipo;
  autor_id?: string;
  tipo: string;
  conteudo: string;
  canal_msg_id?: string;
  is_read: boolean;
  extra_data?: {
    media?: {
      media_kind?: string;
      mimetype?: string;
      file_name?: string;
      base64_inline?: string;
      /** true quando o binário está no servidor (listagem omite o base64) */
      has_inline?: boolean;
      /** anexo legado truncado — /media retorna 404 */
      stub?: boolean;
      size_bytes?: number;
    };
    message_key?: Record<string, unknown>;
    nota_interna?: boolean;
    autor_nome?: string;
    handoff_resumo?: boolean;
    motivo?: string;
    evento?: string;
    atendente_nome?: string;
    atendente_anterior_nome?: string;
  };
  created_at: string;
}

export interface OcAgente {
  id: string;
  nome: string;
  descricao?: string;
  tipo: TipoAgente;
  categoria?: string;
  modelo: string;
  temperatura: number;
  ativo: boolean;
  parent_id?: string | null;
  departamento?: string;
  squad?: string;
  max_tokens: number;
  timeout_ms: number;
  created_at: string;
}

export interface OcAgenteDetail extends OcAgente {
  system_prompt: string;
  contexto_operacional?: string;
}

export interface OcSkillInvocationConfig {
  /** Handler Python para skills internas (ex.: listarProfissionais) */
  handler?: string;
  method?: string;
  path?: string;
  headers?: Record<string, unknown>;
  body_template?: Record<string, unknown> | string | unknown[];
  response_mapping?: Record<string, string>;
}

export interface OcSkill {
  id: string;
  nome: string;
  categoria?: string;
  descricao_llm: string;
  tool_id?: string;
  parameters_schema: Record<string, unknown>;
  invocation_config?: OcSkillInvocationConfig;
  instrucoes_extras?: string;
  timeout_ms: number;
  versao: number;
  ativo: boolean;
  created_at: string;
}

export interface OcTool {
  id: string;
  nome: string;
  descricao?: string;
  tipo: TipoTool;
  config?: Record<string, unknown>;
  created_at: string;
}

export interface OcExecucao {
  id: string;
  conversa_id?: string;
  agente_id?: string;
  skill_id?: string;
  status: StatusRun;
  error_msg?: string;
  tokens_input?: number;
  tokens_output?: number;
  duration_ms?: number;
  started_at: string;
  finished_at?: string;
}

export interface OcPipeline {
  id: string;
  nome: string;
  created_at: string;
  stages_count?: number;
  cards_count?: number;
}

export interface OcPipelineStage {
  id: string;
  nome: string;
  tipo: TipoStage;
  cor: string;
  ordem: number;
}

export interface OcPipelineCard {
  id: string;
  stage_id: string;
  conversa_id?: string;
  titulo?: string;
  valor_estimado?: number;
  won: boolean;
  lost: boolean;
  created_at: string;
}

export interface OcAutomacao {
  id: string;
  nome: string;
  descricao?: string;
  trigger_tipo: string;
  condicoes?: Record<string, unknown>[];
  acoes?: Record<string, unknown>[];
  ativa: boolean;
  limite_rpm: number;
  created_at: string;
}

export interface OcTag {
  id: string;
  nome: string;
  cor: string;
}

export interface OcWatchdogConfig {
  habilitado: boolean;
  threshold_bot_min: number;
  threshold_pending_min: number;
  threshold_open_min: number;
  max_tentativas: number;
  horario_24h: boolean;
}

export type OcHorarioJanela = { inicio: string; fim: string };
export type OcHorarioDia = { dia: number; ativo: boolean; janelas: OcHorarioJanela[] };
export type OcHorarioConfig = { dias: OcHorarioDia[] };

export interface OcProvisionIaDefaults {
  created_tools: number;
  created_skills: number;
  created_agentes: number;
  linked_skills: number;
  created_automacoes: number;
  canais_atualizados: number;
  already_seeded: boolean;
  jarvis_id?: string;
  agendamento_id?: string;
  suporte_id?: string;
  pipeline_id?: string;
  details: string[];
}

export interface OcConfigIA {
  ia_habilitada: boolean;
  pausar_ia_humano_responde: boolean;
  atendimento_24h: boolean;
  horario_config?: OcHorarioConfig | Record<string, unknown>;
  mensagem_fora_horario?: string;
  contexto_negocio?: string;
  limite_tokens_mes?: number;
  dominios_permitidos: string[];
  handoff_keywords?: string[];
  resumo_modelo?: string;
  timezone: string;
}

export interface OcDashboardCanalStat {
  canal_id: string;
  nome: string;
  total: number;
}

export interface OcDashboardSerieDia {
  data: string;
  total: number;
}

export interface OcDashboard {
  conversas_ativas: number;
  conversas_presas: number;
  total_conversas: number;
  conversas_fechadas: number;
  taxa_resolucao_pct: number;
  tempo_primeira_resposta_avg: number;
  fcr_pct: number;
  taxa_reabertura_pct: number;
  csat_avg?: number | null;
  periodo_dias: number;
  por_status: Record<string, number>;
  por_canal: OcDashboardCanalStat[];
  serie_diaria: OcDashboardSerieDia[];
  heatmap: number[][];
}

export interface OcJarvisOverview {
  periodo: string;
  custo_usd: number;
  custo_por_run_usd: number;
  tokens_total: number;
  cache_hits: number;
  runs_total: number;
  runs_ok: number;
  runs_falhas: number;
  taxa_sucesso_pct: number | null;
  latencia_p50_ms: number | null;
  latencia_p95_ms: number | null;
  por_modelo: { modelo: string; custo_usd: number; runs: number; tokens: number }[];
  por_agente: { agente_id: string; nome: string; runs: number; custo_usd: number; tokens: number }[];
  tools_chamadas: { skill_id: string; nome: string; chamadas: number }[];
  por_status: Record<string, number>;
  delegacoes: { de_agente_id?: string; para_agente_id?: string; started_at: string }[];
  ultimas_execucoes: {
    id: string;
    status: string;
    agente_nome?: string;
    modelo?: string;
    duration_ms?: number;
    tokens_input?: number;
    tokens_output?: number;
    error_msg?: string;
    started_at: string;
  }[];
}
