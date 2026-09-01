'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/http/api-client';
import type {
  OcAgente,
  OcAgenteDetail,
  OcAutomacao,
  OcCanal,
  OcCanalListItem,
  OcCanalQr,
  OcCanalSyncResult,
  OcCanalTestResult,
  OcConfigIA,
  OcConversa,
  OcDashboard,
  OcJarvisOverview,
  OcExecucao,
  OcInbox,
  OcInboxFiltros,
  OcMensagem,
  OcPipeline,
  OcPipelineCard,
  OcPipelineStage,
  OcProvisionIaDefaults,
  OcSkill,
  OcTag,
  OcTool,
  OcWatchdogConfig,
} from '../types';

/** Prefixo org-scoped no padrão do financeiro. */
function ocBase(org: string) {
  return `organizations/${org}/omnichannel`;
}

function useOcOrg() {
  const params = useParams();
  const org = typeof params.slug === 'string' ? params.slug : '';
  return { org, enabled: !!org };
}

function ocApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; response?: { message?: string; error?: string; detail?: unknown } };
    const detail = e.response?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d) => (typeof d === 'object' && d && 'msg' in d ? String((d as { msg: string }).msg) : String(d)))
        .join('; ');
    }
    if (e.response?.message) return e.response.message;
    if (e.response?.error) return e.response.error;
    if (e.message) return e.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function requireOrg(org: string): string {
  if (!org) throw new Error('Organização não encontrada no contexto da rota.');
  return org;
}

async function ocGet<T>(org: string, path: string): Promise<T> {
  return api.get(`${ocBase(org)}${path}`).json<T>();
}

async function ocPost<T>(org: string, path: string, body?: unknown): Promise<T> {
  return api.post(`${ocBase(org)}${path}`, { json: body ?? {} }).json<T>();
}

async function ocPatch<T>(org: string, path: string, body: unknown): Promise<T> {
  return api.patch(`${ocBase(org)}${path}`, { json: body }).json<T>();
}

async function ocDelete(org: string, path: string): Promise<void> {
  await api.delete(`${ocBase(org)}${path}`);
}

function useOcMutation<TData, TVariables>(
  options: {
    mutationFn: (ctx: { org: string }, vars: TVariables) => Promise<TData>;
    onSuccess?: () => void;
    errorMessage?: string;
    successMessage?: string;
    invalidateKeys?: unknown[][];
  },
) {
  const { org } = useOcOrg();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: TVariables) =>
      options.mutationFn({ org: requireOrg(org) }, vars),
    onSuccess: () => {
      options.invalidateKeys?.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      options.onSuccess?.();
      if (options.successMessage) toast.success(options.successMessage);
    },
    onError: (err) => {
      toast.error(ocApiErrorMessage(err, options.errorMessage ?? 'Operação falhou'));
    },
  });
}

// ── Canais ────────────────────────────────────────────────────────────────────
export const useOcCanaisQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'canais'],
    queryFn: () => ocGet<OcCanalListItem[]>(org, '/canais'),
    enabled,
  });
};

export const useOcCanalWebhookUrlQuery = (enabled = true) => {
  const { org, enabled: clientEnabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'canais', 'webhook-url'],
    queryFn: () => ocGet<{ webhook_url: string }>(org, '/canais/meta/webhook-url'),
    enabled: clientEnabled && enabled,
  });
};

export const useOcCanalWhatsappCreate = () =>
  useOcMutation<
    OcCanalListItem,
    { nome: string; token?: string }
  >({
    mutationFn: ({ org }, body) => ocPost<OcCanalListItem>(org, '/canais/whatsapp', body),
    invalidateKeys: [['oc', 'canais'], ['oc', 'inboxes']],
    successMessage: 'Canal WhatsApp criado',
    errorMessage: 'Erro ao criar canal WhatsApp',
  });

export const useOcCanalLandingFormCreate = () =>
  useOcMutation<
    OcCanalListItem,
    { nome: string }
  >({
    mutationFn: ({ org }, body) =>
      ocPost<OcCanalListItem>(org, '/canais/landing-form', body),
    invalidateKeys: [['oc', 'canais'], ['oc', 'inboxes']],
    successMessage: 'Canal do formulário da landing criado',
    errorMessage: 'Erro ao criar canal da landing',
  });

export const useOcCanalLandingIngestUrlQuery = (enabled = true) => {
  const { org, enabled: clientEnabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'canais', 'landing-ingest-url'],
    queryFn: () => ocGet<{ ingest_url: string }>(org, '/canais/meta/landing-ingest-url'),
    enabled: clientEnabled && enabled,
  });
};

export const useOcCanalCreate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<OcCanal>) => ocPost<OcCanal>(org, '/canais', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'canais'] }),
  });
};

export const useOcCanalPatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<OcCanal>) =>
      ocPatch<OcCanal>(org, `/canais/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'canais'] }),
  });
};

export const useOcCanalDelete = () =>
  useOcMutation<void, string>({
    mutationFn: ({ org }, id) => ocDelete(org, `/canais/${id}`),
    invalidateKeys: [['oc', 'canais'], ['oc', 'inboxes'], ['oc', 'conversas']],
    successMessage: 'Canal excluído',
    errorMessage: 'Erro ao excluir canal',
  });

export const useOcCanalSync = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (canalId: string) =>
      ocPost<OcCanalSyncResult>(
        requireOrg(org),
        `/canais/${canalId}/sincronizar`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['oc', 'canais'],
        predicate: (q) => !q.queryKey.includes('qr'),
      });
    },
    onError: (err) => {
      toast.error(ocApiErrorMessage(err, 'Erro ao sincronizar canal'));
    },
  });
};

export const useOcCanalTest = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (canalId: string) =>
      ocPost<OcCanalTestResult>(
        requireOrg(org),
        `/canais/${canalId}/testar`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['oc', 'canais'],
        predicate: (q) => !q.queryKey.includes('qr'),
      });
    },
    onError: (err) => {
      toast.error(ocApiErrorMessage(err, 'Erro ao testar conexão'));
    },
  });
};

export const useOcCanalQrQuery = (canalId: string | null, enabled = true) => {
  const { org, enabled: clientEnabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'canais', canalId, 'qr'],
    queryFn: () => ocGet<OcCanalQr>(org, `/canais/${canalId}/qr`),
    enabled: clientEnabled && enabled && !!canalId,
    staleTime: 30_000,
    retry: 1,
  });
};

// ── Conversas ─────────────────────────────────────────────────────────────────
export const useOcConversasQuery = (filtros?: {
  status?: string;
  statuses?: string[];
  canal_id?: string;
  tag?: string;
  tags?: string[];
  tipo_conversa?: string;
  inbox_id?: string;
  atribuicao?: string;
  q?: string;
}) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'conversas', filtros],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filtros?.inbox_id) params.set('inbox_id', filtros.inbox_id);
      if (filtros?.statuses?.length) params.set('statuses', filtros.statuses.join(','));
      else if (filtros?.status && filtros.status !== 'todos') params.set('status', filtros.status);
      if (filtros?.canal_id) params.set('canal_id', filtros.canal_id);
      if (filtros?.tags?.length) params.set('tags', filtros.tags.join(','));
      else if (filtros?.tag) params.set('tag', filtros.tag);
      if (filtros?.tipo_conversa) params.set('tipo_conversa', filtros.tipo_conversa);
      if (filtros?.atribuicao) params.set('atribuicao', filtros.atribuicao);
      if (filtros?.q?.trim()) params.set('q', filtros.q.trim());
      const qs = params.toString();
      return ocGet<OcConversa[]>(org, `/conversas${qs ? `?${qs}` : ''}`);
    },
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
};

export const useOcConversaQuery = (id: string | null) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'conversa', id],
    queryFn: () => ocGet<OcConversa>(org, `/conversas/${id}`),
    enabled: enabled && !!id,
  });
};

export const useOcConversaPatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      ocPatch<OcConversa>(org, `/conversas/${id}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', vars.id] });
      qc.invalidateQueries({ queryKey: ['oc', 'mensagens', vars.id] });
    },
  });
};

export const useOcEncerrarConversa = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ocPost<OcConversa>(org, `/conversas/${id}/encerrar`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', id] });
      qc.invalidateQueries({ queryKey: ['oc', 'mensagens', id] });
    },
  });
};

export const useOcReabrirConversa = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ocPost<OcConversa>(org, `/conversas/${id}/reabrir`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', id] });
      qc.invalidateQueries({ queryKey: ['oc', 'mensagens', id] });
    },
  });
};

export const useOcMarcarConversaLidas = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversaId: string) => {
      await api.post(`${ocBase(requireOrg(org))}/conversas/${conversaId}/marcar-lidas`, { json: {} });
    },
    onSuccess: (_, conversaId) => {
      qc.setQueriesData<OcConversa[]>(
        { queryKey: ['oc', 'conversas'] },
        (old) => old?.map((c) => (c.id === conversaId ? { ...c, nao_lidas: 0 } : c)),
      );
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', conversaId] });
    },
  });
};

// ── Mensagens ─────────────────────────────────────────────────────────────────
export const useOcMensagensQuery = (conversaId: string | null) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'mensagens', conversaId],
    queryFn: () => ocGet<OcMensagem[]>(org, `/conversas/${conversaId}/mensagens?limit=100`),
    enabled: enabled && !!conversaId,
    refetchInterval: enabled && conversaId ? 3000 : false,
  });
};

export const useOcEnviarMensagem = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversaId,
      conteudo,
      destino,
    }: {
      conversaId: string;
      conteudo: string;
      destino?: 'email' | 'whatsapp';
    }) =>
      ocPost<OcMensagem>(org, `/conversas/${conversaId}/mensagens`, {
        conteudo,
        ...(destino ? { destino } : {}),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'mensagens', vars.conversaId] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', vars.conversaId] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
      qc.invalidateQueries({ queryKey: ['oc', 'cards'] });
      qc.invalidateQueries({ queryKey: ['oc', 'pipelines'] });
    },
  });
};

export const useOcEnviarAnexo = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversaId,
      file,
      legenda,
    }: {
      conversaId: string;
      file: File;
      legenda?: string;
    }) => {
      const form = new FormData();
      form.append('file', file);
      if (legenda?.trim()) form.append('legenda', legenda.trim());
      return api
        .post(`${ocBase(requireOrg(org))}/conversas/${conversaId}/mensagens/anexo`, {
          body: form,
        })
        .json<OcMensagem>();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'mensagens', vars.conversaId] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', vars.conversaId] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
      const isAudio = vars.file.type.startsWith('audio/');
      toast.success(isAudio ? 'Áudio enviado' : 'Anexo enviado');
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Falha ao enviar anexo')),
  });
};

export const useOcEnviarNotaInterna = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversaId, conteudo }: { conversaId: string; conteudo: string }) =>
      ocPost<OcMensagem>(org, `/conversas/${conversaId}/notas-internas`, { conteudo }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['oc', 'mensagens', vars.conversaId] }),
  });
};

// ── Agentes ───────────────────────────────────────────────────────────────────
export const useOcAgentesQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'agentes'],
    queryFn: () => ocGet<OcAgente[]>(org, '/agentes'),
    enabled,
  });
};

export const useOcAgenteQuery = (id: string | null, enabled = true) => {
  const { org, enabled: clientEnabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'agentes', id],
    queryFn: () => ocGet<OcAgenteDetail>(org, `/agentes/${id}`),
    enabled: clientEnabled && enabled && !!id,
  });
};

export const useOcAgenteCreate = () =>
  useOcMutation<OcAgente, Partial<OcAgente> & { system_prompt: string }>({
    mutationFn: ({ org }, body) => {
      const payload = {
        ...body,
        descricao: body.descricao?.trim() || undefined,
        categoria: body.categoria?.trim() || undefined,
        departamento: body.departamento?.trim() || undefined,
        squad: body.squad?.trim() || undefined,
        parent_id: body.parent_id || undefined,
      };
      return ocPost<OcAgente>(org, '/agentes', payload);
    },
    invalidateKeys: [['oc', 'agentes']],
    successMessage: 'Agente criado',
    errorMessage: 'Erro ao criar agente',
  });

export type OcAgentePatchVars = {
  id: string;
  nome?: string;
  descricao?: string;
  tipo?: string;
  categoria?: string;
  system_prompt?: string;
  contexto_operacional?: string;
  temperatura?: number;
  ativo?: boolean;
  modelo?: string;
  parent_id?: string | null;
  departamento?: string;
  squad?: string;
};

export const useOcAgentePatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: OcAgentePatchVars) =>
      ocPatch<OcAgente>(requireOrg(org), `/agentes/${id}`, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['oc', 'agentes'] });
      qc.invalidateQueries({ queryKey: ['oc', 'agentes', id] });
      toast.success('Agente atualizado');
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Erro ao atualizar agente')),
  });
};

export const useOcAgenteDelete = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ocDelete(org, `/agentes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'agentes'] }),
  });
};

export const useOcAgenteSkillsQuery = (agenteId: string | null, enabled = true) => {
  const { org, enabled: clientEnabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'agentes', agenteId, 'skills'],
    queryFn: () => ocGet<OcSkill[]>(org, `/agentes/${agenteId}/skills`),
    enabled: clientEnabled && enabled && !!agenteId,
  });
};

export const useOcAgenteSkillLink = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agenteId, skillId }: { agenteId: string; skillId: string }) =>
      ocPost<void>(
        requireOrg(org),
        `/agentes/${agenteId}/skills/${skillId}`,
      ),
    onSuccess: (_, { agenteId }) => {
      qc.invalidateQueries({ queryKey: ['oc', 'agentes', agenteId, 'skills'] });
      toast.success('Skill vinculada');
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Erro ao vincular skill')),
  });
};

export const useOcAgenteSkillUnlink = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agenteId, skillId }: { agenteId: string; skillId: string }) =>
      ocDelete(
        requireOrg(org),
        `/agentes/${agenteId}/skills/${skillId}`,
      ),
    onSuccess: (_, { agenteId }) => {
      qc.invalidateQueries({ queryKey: ['oc', 'agentes', agenteId, 'skills'] });
      toast.success('Skill desvinculada');
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Erro ao desvincular skill')),
  });
};

// ── Skills ────────────────────────────────────────────────────────────────────
export const useOcSkillsQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'skills'],
    queryFn: () => ocGet<OcSkill[]>(org, '/skills'),
    enabled,
  });
};

export const useOcSkillCreate = () =>
  useOcMutation<OcSkill, Partial<OcSkill>>({
    mutationFn: ({ org }, body) => {
      const payload = {
        ...body,
        categoria: body.categoria?.trim() || undefined,
        instrucoes_extras: body.instrucoes_extras?.trim() || undefined,
        tool_id: body.tool_id || undefined,
        invocation_config: body.invocation_config ?? {},
      };
      return ocPost<OcSkill>(org, '/skills', payload);
    },
    invalidateKeys: [['oc', 'skills']],
    successMessage: 'Skill criada',
    errorMessage: 'Erro ao criar skill',
  });

export const useOcSkillPatch = () =>
  useOcMutation<OcSkill, { id: string } & Partial<OcSkill>>({
    mutationFn: ({ org }, { id, ...body }) => {
      const payload = {
        ...body,
        categoria: body.categoria?.trim() || undefined,
        instrucoes_extras: body.instrucoes_extras?.trim() || undefined,
        tool_id: body.tool_id || undefined,
      };
      return ocPatch<OcSkill>(org, `/skills/${id}`, payload);
    },
    invalidateKeys: [['oc', 'skills']],
    successMessage: 'Skill atualizada',
    errorMessage: 'Erro ao atualizar skill',
  });

export const useOcSkillDelete = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ocDelete(org, `/skills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'skills'] }),
  });
};

// ── Tools ─────────────────────────────────────────────────────────────────────
export const useOcToolsQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'tools'],
    queryFn: () => ocGet<OcTool[]>(org, '/tools'),
    enabled,
  });
};

export const useOcToolCreate = () =>
  useOcMutation<OcTool, Partial<OcTool> & { config: Record<string, unknown> }>({
    mutationFn: ({ org }, body) => ocPost<OcTool>(org, '/tools', body),
    invalidateKeys: [['oc', 'tools']],
    successMessage: 'Tool criada',
    errorMessage: 'Erro ao criar tool',
  });

export const useOcToolPatch = () =>
  useOcMutation<OcTool, { id: string } & Partial<OcTool> & { config?: Record<string, unknown> }>({
    mutationFn: ({ org }, { id, ...body }) => ocPatch<OcTool>(org, `/tools/${id}`, body),
    invalidateKeys: [['oc', 'tools']],
    successMessage: 'Tool atualizada',
    errorMessage: 'Erro ao atualizar tool',
  });

// ── Jarvis overview ───────────────────────────────────────────────────────────
export const useOcJarvisOverviewQuery = (periodo: '24h' | '7d' | '30d' = '7d') => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'jarvis', 'overview', periodo],
    queryFn: () => ocGet<OcJarvisOverview>(org, `/jarvis/overview?periodo=${periodo}`),
    enabled,
    refetchInterval: enabled ? 5000 : false,
  });
};

// ── Execuções ─────────────────────────────────────────────────────────────────
export const useOcExecucoesQuery = (filtros?: { dias?: number; status?: string; so_erros?: boolean }) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'execucoes', filtros],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filtros?.dias) params.set('dias', String(filtros.dias));
      if (filtros?.status) params.set('status', filtros.status);
      if (filtros?.so_erros) params.set('so_erros', 'true');
      const qs = params.toString();
      return ocGet<OcExecucao[]>(org, `/execucoes${qs ? `?${qs}` : ''}`);
    },
    enabled,
    refetchInterval: enabled ? 10000 : false,
  });
};

// ── Pipelines ─────────────────────────────────────────────────────────────────
export const useOcPipelinesQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'pipelines'],
    queryFn: () => ocGet<OcPipeline[]>(org, '/pipelines'),
    enabled,
  });
};

export const useOcPipelineQuery = (pipelineId: string | null) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'pipeline', pipelineId],
    queryFn: () => ocGet<OcPipeline>(org, `/pipelines/${pipelineId}`),
    enabled: enabled && !!pipelineId,
  });
};

export const useOcPipelineCreate = () =>
  useOcMutation<OcPipeline, { nome: string }>({
    mutationFn: ({ org }, body) => ocPost<OcPipeline>(org, '/pipelines', body),
    invalidateKeys: [['oc', 'pipelines']],
    successMessage: 'Pipeline criado',
    errorMessage: 'Erro ao criar pipeline',
  });

export const useOcPipelineDelete = () =>
  useOcMutation<void, string>({
    mutationFn: ({ org }, pipelineId) => ocDelete(org, `/pipelines/${pipelineId}`),
    invalidateKeys: [['oc', 'pipelines']],
    successMessage: 'Pipeline excluído',
    errorMessage: 'Erro ao excluir pipeline',
  });

export const useOcStagesQuery = (pipelineId: string | null) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'stages', pipelineId],
    queryFn: () => ocGet<OcPipelineStage[]>(org, `/pipelines/${pipelineId}/stages`),
    enabled: enabled && !!pipelineId,
  });
};

export const useOcStageCreate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      ...body
    }: {
      pipelineId: string;
      nome: string;
      tipo: string;
      cor: string;
      ordem: number;
    }) => ocPost<OcPipelineStage>(org, `/pipelines/${pipelineId}/stages`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'stages', vars.pipelineId] });
      qc.invalidateQueries({ queryKey: ['oc', 'pipelines'] });
    },
  });
};

export const useOcCardsQuery = (pipelineId: string | null) => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'cards', pipelineId],
    queryFn: () => ocGet<OcPipelineCard[]>(org, `/pipelines/${pipelineId}/cards`),
    enabled: enabled && !!pipelineId,
  });
};

export const useOcCardCreate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      ...body
    }: {
      pipelineId: string;
      stage_id: string;
      conversa_id?: string;
      titulo?: string;
      valor_estimado?: number;
    }) => ocPost<OcPipelineCard>(org, `/pipelines/${pipelineId}/cards`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'cards', vars.pipelineId] });
      qc.invalidateQueries({ queryKey: ['oc', 'pipelines'] });
    },
  });
};

export const useOcCardPatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      pipelineId: _pipelineId,
      sourcePipelineId,
      ...body
    }: {
      id: string;
      pipelineId: string;
      sourcePipelineId?: string;
    } & Partial<OcPipelineCard> & { pipeline_id?: string }) =>
      ocPatch<OcPipelineCard>(org, `/cards/${id}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'cards', vars.pipelineId] });
      const from = vars.sourcePipelineId ?? vars.pipelineId;
      if (vars.pipeline_id && vars.pipeline_id !== from) {
        qc.invalidateQueries({ queryKey: ['oc', 'cards', vars.pipeline_id] });
      }
      if (from !== vars.pipelineId) {
        qc.invalidateQueries({ queryKey: ['oc', 'cards', from] });
      }
      qc.invalidateQueries({ queryKey: ['oc', 'pipelines'] });
    },
  });
};

// ── Watchdog ──────────────────────────────────────────────────────────────────
export const useOcWatchdogQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'watchdog'],
    queryFn: () =>
      ocGet<{
        config: OcWatchdogConfig;
        conversas_presas: number;
        timers_ativos: number;
        checks_24h: number;
        reativacoes_24h: number;
      }>(org, '/watchdog'),
    enabled,
    refetchInterval: enabled ? 15000 : false,
  });
};

export const useOcWatchdogPatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<OcWatchdogConfig>) => ocPatch<OcWatchdogConfig>(org, '/watchdog', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'watchdog'] }),
  });
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const useOcDashboardQuery = (periodo = '30d') => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'dashboard', periodo],
    queryFn: () => ocGet<OcDashboard>(org, `/dashboard?periodo=${periodo}`),
    enabled,
    refetchInterval: enabled ? 30000 : false,
  });
};

// ── Config IA ─────────────────────────────────────────────────────────────────
export const useOcConfigIAQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'config-ia'],
    queryFn: () => ocGet<OcConfigIA>(org, '/config/ia'),
    enabled,
  });
};

export const useOcConfigIAPatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<OcConfigIA>) => ocPatch<OcConfigIA>(org, '/config/ia', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'config-ia'] }),
  });
};

export const useOcProvisionIaDefaults = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (force?: boolean) =>
      ocPost<OcProvisionIaDefaults>(
        requireOrg(org),
        `/provision/ia-defaults${force ? '?force=true' : ''}`,
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['oc', 'agentes'] });
      qc.invalidateQueries({ queryKey: ['oc', 'skills'] });
      qc.invalidateQueries({ queryKey: ['oc', 'tools'] });
      qc.invalidateQueries({ queryKey: ['oc', 'pipelines'] });
      qc.invalidateQueries({ queryKey: ['oc', 'canais'] });
      if (data.already_seeded) {
        toast.info('Stack IA já estava provisionada');
      } else {
        toast.success('Stack IA padrão provisionada');
      }
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Falha ao provisionar stack IA')),
  });
};

// ── Inboxes ───────────────────────────────────────────────────────────────────
export const useOcInboxesQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'inboxes'],
    queryFn: () => ocGet<OcInbox[]>(org, '/inboxes'),
    enabled,
  });
};

export const useOcInboxCreate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      nome: string;
      icone?: string;
      cor?: string;
      filtros?: OcInboxFiltros;
    }) => ocPost<OcInbox>(org, '/inboxes', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'inboxes'] }),
  });
};

export const useOcInboxUpdate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inboxId,
      body,
    }: {
      inboxId: string;
      body: {
        nome: string;
        icone?: string;
        cor?: string;
        filtros?: OcInboxFiltros;
      };
    }) => ocPatch<OcInbox>(org, `/inboxes/${inboxId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'inboxes'] }),
  });
};

export const useOcInboxDelete = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inboxId: string) => ocDelete(org, `/inboxes/${inboxId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'inboxes'] }),
  });
};

// ── Tags ──────────────────────────────────────────────────────────────────────
export const useOcTagsQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'tags'],
    queryFn: () => ocGet<OcTag[]>(org, '/config/tags'),
    enabled,
  });
};

export const useOcTagCreate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { nome: string; cor: string }) => ocPost<OcTag>(org, '/config/tags', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oc', 'tags'] }),
  });
};

// ── Automações ────────────────────────────────────────────────────────────────
export const useOcAutomacoesQuery = () => {
  const { org, enabled } = useOcOrg();
  return useQuery({
    queryKey: ['oc', 'automacoes'],
    queryFn: () => ocGet<OcAutomacao[]>(org, '/automacoes'),
    enabled,
  });
};

export const useOcAutomacaoCreate = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      nome: string;
      trigger_tipo: string;
      condicoes?: Record<string, unknown>[];
      acoes?: Record<string, unknown>[];
      limite_rpm?: number;
      descricao?: string;
    }) => ocPost<OcAutomacao>(org, '/automacoes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oc', 'automacoes'] });
      toast.success('Automação criada');
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Falha ao criar automação')),
  });
};

export const useOcAutomacaoPatch = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      nome?: string;
      descricao?: string;
      trigger_tipo?: string;
      ativa?: boolean;
      condicoes?: Record<string, unknown>[];
      acoes?: Record<string, unknown>[];
      limite_rpm?: number;
    }) => ocPatch<OcAutomacao>(org, `/automacoes/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oc', 'automacoes'] });
      toast.success('Automação atualizada');
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Falha ao atualizar automação')),
  });
};

export const useOcAutomacaoDelete = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ocDelete(org, `/automacoes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oc', 'automacoes'] });
      toast.success('Automação removida');
    },
  });
};

export const useOcExecutarAutomacao = () => {
  const { org } = useOcOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversaId,
      automacaoId,
    }: {
      conversaId: string;
      automacaoId: string;
    }) =>
      ocPost<{ ok: boolean; resultados: { ok?: boolean; erro?: string; tipo?: string }[] }>(
        requireOrg(org),
        `/conversas/${conversaId}/automacoes/${automacaoId}/executar`,
        {},
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['oc', 'conversa', vars.conversaId] });
      qc.invalidateQueries({ queryKey: ['oc', 'mensagens', vars.conversaId] });
      qc.invalidateQueries({ queryKey: ['oc', 'conversas'] });
    },
    onError: (err) => toast.error(ocApiErrorMessage(err, 'Falha ao executar automação')),
  });
};
