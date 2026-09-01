'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useOcAutomacaoCreate,
  useOcAutomacaoPatch,
  useOcPipelinesQuery,
  useOcStagesQuery,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { OcAutomacao } from '@/features/omnichannel/types';
import {
  OcCondicoesEditor,
  sanitizeConditionGroups,
  type ConditionGroup,
  type ConditionRule,
} from '@/features/omnichannel/components/automacoes/oc-condicoes-editor';

const TRIGGERS = [
  { value: 'tag_adicionada', label: 'Tag adicionada' },
  { value: 'tag_removida', label: 'Tag removida' },
  { value: 'mensagem_recebida', label: 'Mensagem recebida' },
  { value: 'status_mudou', label: 'Status mudou' },
  { value: 'conversa_atribuida', label: 'Conversa atribuída' },
] as const;

const ACTION_TYPES = [
  { value: 'adicionar_tag', label: 'Adicionar tag' },
  { value: 'remover_tag', label: 'Remover tag' },
  { value: 'mudar_status', label: 'Mudar status' },
  { value: 'enviar_mensagem', label: 'Enviar mensagem' },
  { value: 'adicionar_pipeline', label: 'Adicionar ao pipeline' },
] as const;

const STATUS_OPTS = ['bot', 'pending', 'open', 'closed', 'snoozed'];

type ActionRow = {
  tipo: string;
  tag: string;
  alvo: string;
  status: string;
  conteudo: string;
  pipeline_id: string;
  stage_id: string;
};

const emptyAction = (): ActionRow => ({
  tipo: 'adicionar_tag',
  tag: '',
  alvo: 'conversa',
  status: 'pending',
  conteudo: '',
  pipeline_id: '',
  stage_id: '',
});

type Props = {
  open: boolean;
  onClose: () => void;
  automacao?: OcAutomacao | null;
};

function parseCondicoes(raw?: Record<string, unknown>[]): ConditionGroup[] {
  if (!raw?.length) return [];
  const first = raw[0];
  if (first && 'field' in first && !('rules' in first)) {
    return [{ group: 'TODAS', rules: raw as unknown as ConditionRule[] }];
  }
  return raw.map((g) => ({
    group: (String(g.group || 'TODAS').toUpperCase() === 'QUALQUER' ? 'QUALQUER' : 'TODAS') as
      | 'TODAS'
      | 'QUALQUER',
    rules: ((g.rules as ConditionRule[]) ?? []).map((r) => ({
      field: String(r.field ?? ''),
      operator: String(r.operator ?? 'eq'),
      value: String(r.value ?? ''),
    })),
  }));
}

function parseActions(raw?: Record<string, unknown>[]): ActionRow[] {
  if (!raw?.length) return [emptyAction()];
  return raw.map((ac) => {
    const tipo = String(ac.tipo ?? '');
    const params = (ac.params ?? {}) as Record<string, string>;
    return {
      tipo,
      tag: String(params.tag ?? ''),
      alvo: String(params.alvo ?? 'conversa'),
      status: String(params.status ?? 'pending'),
      conteudo: String(params.conteudo ?? ''),
      pipeline_id: String(params.pipeline_id ?? ''),
      stage_id: String(params.stage_id ?? ''),
    };
  });
}

function buildActions(rows: ActionRow[]) {
  return rows
    .filter((r) => r.tipo)
    .map((r) => {
      const params: Record<string, string> = {};
      if (r.tipo === 'adicionar_tag' || r.tipo === 'remover_tag') {
        params.tag = r.tag;
        if (r.tipo === 'adicionar_tag') params.alvo = r.alvo;
      }
      if (r.tipo === 'mudar_status') params.status = r.status;
      if (r.tipo === 'enviar_mensagem') params.conteudo = r.conteudo;
      if (r.tipo === 'adicionar_pipeline') {
        params.pipeline_id = r.pipeline_id;
        params.stage_id = r.stage_id;
      }
      return { tipo: r.tipo, params };
    });
}

export function OcAutomacaoModal({ open, onClose, automacao }: Props) {
  const isEdit = !!automacao;
  const criar = useOcAutomacaoCreate();
  const atualizar = useOcAutomacaoPatch();
  const { data: pipelines = [] } = useOcPipelinesQuery();

  const [nome, setNome] = useState('');
  const [trigger, setTrigger] = useState<string>('mensagem_recebida');
  const [limiteRpm, setLimiteRpm] = useState(10);
  const [ativa, setAtiva] = useState(true);
  const [condicoes, setCondicoes] = useState<ConditionGroup[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([emptyAction()]);
  const [skipTriggerReset, setSkipTriggerReset] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (automacao) {
      setNome(automacao.nome);
      setTrigger(automacao.trigger_tipo);
      setLimiteRpm(automacao.limite_rpm);
      setAtiva(automacao.ativa);
      setCondicoes(parseCondicoes(automacao.condicoes));
      setActions(parseActions(automacao.acoes));
      setSkipTriggerReset(true);
    } else {
      setNome('');
      setTrigger('mensagem_recebida');
      setLimiteRpm(10);
      setAtiva(true);
      setCondicoes([]);
      setActions([emptyAction()]);
      setSkipTriggerReset(false);
    }
  }, [open, automacao]);

  useEffect(() => {
    if (skipTriggerReset) {
      setSkipTriggerReset(false);
      return;
    }
    setCondicoes([]);
  }, [trigger, skipTriggerReset]);

  const handleClose = (v: boolean) => {
    if (!v) onClose();
  };

  const updateAction = (idx: number, patch: Partial<ActionRow>) => {
    setActions((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const pipelineIdForStages =
    actions.find((a) => a.tipo === 'adicionar_pipeline' && a.pipeline_id)?.pipeline_id ?? null;
  const { data: stages = [] } = useOcStagesQuery(pipelineIdForStages);

  const handleSubmit = () => {
    if (!nome.trim()) return;
    const payload = {
      nome: nome.trim(),
      trigger_tipo: trigger,
      limite_rpm: limiteRpm,
      condicoes: sanitizeConditionGroups(condicoes),
      acoes: buildActions(actions),
      ...(isEdit ? { ativa } : {}),
    };

    if (isEdit && automacao) {
      atualizar.mutate({ id: automacao.id, ...payload }, { onSuccess: () => handleClose(false) });
    } else {
      criar.mutate(payload, { onSuccess: () => handleClose(false) });
    }
  };

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar automação' : 'Nova automação'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Quando o trigger ocorrer e as condições forem atendidas, as ações rodam em sequência.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Ativa</Label>
                <p className="text-xs text-muted-foreground">Automações inativas não disparam</p>
              </div>
              <Switch checked={ativa} onCheckedChange={setAtiva} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: VIP → fila humana"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Limite / min (por conversa)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={limiteRpm}
                onChange={(e) => setLimiteRpm(Number(e.target.value) || 10)}
              />
            </div>
          </div>

          <OcCondicoesEditor trigger={trigger} value={condicoes} onChange={setCondicoes} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ações</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActions((a) => [...a, emptyAction()])}
              >
                <Plus className="mr-1 h-3 w-3" /> Ação
              </Button>
            </div>
            {actions.map((row, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Select value={row.tipo} onValueChange={(v) => updateAction(idx, { tipo: v })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setActions((a) => a.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                {(row.tipo === 'adicionar_tag' || row.tipo === 'remover_tag') && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome da tag"
                      value={row.tag}
                      onChange={(e) => updateAction(idx, { tag: e.target.value })}
                    />
                    {row.tipo === 'adicionar_tag' && (
                      <Select value={row.alvo} onValueChange={(v) => updateAction(idx, { alvo: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conversa">Conversa</SelectItem>
                          <SelectItem value="contato">Contato</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                {row.tipo === 'mudar_status' && (
                  <Select value={row.status} onValueChange={(v) => updateAction(idx, { status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {row.tipo === 'enviar_mensagem' && (
                  <Textarea
                    rows={3}
                    placeholder="Texto enviado ao WhatsApp"
                    value={row.conteudo}
                    onChange={(e) => updateAction(idx, { conteudo: e.target.value })}
                  />
                )}
                {row.tipo === 'adicionar_pipeline' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={row.pipeline_id || '_none'}
                      onValueChange={(v) =>
                        updateAction(idx, { pipeline_id: v === '_none' ? '' : v, stage_id: '' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Selecione…</SelectItem>
                        {pipelines.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={row.stage_id || '_none'}
                      onValueChange={(v) => updateAction(idx, { stage_id: v === '_none' ? '' : v })}
                      disabled={!row.pipeline_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estágio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Selecione…</SelectItem>
                        {stages.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !nome.trim()}>
            {isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar automação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
