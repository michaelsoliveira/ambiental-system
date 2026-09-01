'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useOcAgentesQuery,
  useOcAgenteCreate,
  useOcAgentePatch,
  useOcAgenteQuery,
  useOcAgenteDelete,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { TipoAgente } from '@/features/omnichannel/types';
import { getDepartamentos } from './oc-agentes-layout';
import { AGENTE_MODELOS, DEFAULT_AGENTE_MODELO, MODELO_GROUPS } from './oc-agente-constants';
import { OcAgenteSkillsSection } from './oc-agente-skills-section';
import { OcAgenteCanaisSection } from './oc-agente-canais-section';

const CONTEXTO_MAX = 8000;

type AgenteFormState = {
  nome: string;
  descricao: string;
  tipo: TipoAgente;
  categoria: string;
  departamento: string;
  modelo: string;
  system_prompt: string;
  contexto_operacional: string;
  temperatura: number;
  parent_id: string;
  squad: string;
};

const DEFAULT_FORM: AgenteFormState = {
  nome: '',
  descricao: '',
  tipo: 'worker',
  categoria: '',
  departamento: '',
  modelo: DEFAULT_AGENTE_MODELO,
  system_prompt: 'Você é um assistente de atendimento.',
  contexto_operacional: '',
  temperatura: 0.7,
  parent_id: '',
  squad: '',
};

type AgenteFormFieldsProps = {
  form: AgenteFormState;
  setForm: React.Dispatch<React.SetStateAction<AgenteFormState>>;
  agentes: { id: string; nome: string; departamento?: string; categoria?: string }[];
  excludeAgenteId?: string;
  mode: 'create' | 'edit';
};

function AgenteFormFields({ form, setForm, agentes, excludeAgenteId, mode }: AgenteFormFieldsProps) {
  const parentOptions = agentes.filter((a) => a.id !== excludeAgenteId);
  const departamentos = useMemo(() => getDepartamentos(agentes as never), [agentes]);

  const deptOptions = useMemo(() => {
    const labels = new Set(departamentos.map((d) => d.label));
    if (form.departamento.trim()) labels.add(form.departamento.trim());
    return Array.from(labels).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [departamentos, form.departamento]);

  if (mode === 'edit') {
    return (
      <div className="space-y-5 py-1">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Input
            placeholder="Realiza atendimento"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Modelo</Label>
          <Select value={form.modelo} onValueChange={(v) => setForm({ ...form, modelo: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {MODELO_GROUPS.map((group) => (
                <div key={group}>
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </div>
                  {AGENTE_MODELOS.filter((m) => m.group === group).map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>System prompt</Label>
          <Textarea
            rows={8}
            className="min-h-[160px] resize-y text-sm leading-relaxed"
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
            Contexto operacional do dia
          </p>
          <p className="text-[11px] text-muted-foreground">
            Memória viva injetada no prompt — atualize quando rodar campanha, der aula, mudar oferta…
          </p>
          <Textarea
            rows={4}
            placeholder="Deixe vazio se hoje não tem nada operacional…"
            value={form.contexto_operacional}
            onChange={(e) =>
              setForm({
                ...form,
                contexto_operacional: e.target.value.slice(0, CONTEXTO_MAX),
              })
            }
            className="resize-y bg-background text-sm"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {form.contexto_operacional.length} / {CONTEXTO_MAX}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Criatividade ({form.temperatura.toFixed(2)})</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.temperatura}
            onChange={(e) => setForm({ ...form, temperatura: parseFloat(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>

        <div className="space-y-3 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Organograma</p>
            <p className="text-xs text-muted-foreground">
              Define hierarquia (chefia direta), departamento e squad ágil.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Reporta a (chefe direto)</Label>
              <Select
                value={form.parent_id || 'none'}
                onValueChange={(v) => setForm({ ...form, parent_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="— sem chefe —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Raiz / sem chefe —</SelectItem>
                  {parentOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Departamento</Label>
              <Select
                value={form.departamento || 'none'}
                onValueChange={(v) =>
                  setForm({ ...form, departamento: v === 'none' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— nenhum —</SelectItem>
                  {deptOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Squad ágil</Label>
            <Input
              placeholder="Ex: Inbound B2C"
              value={form.squad}
              onChange={(e) => setForm({ ...form, squad: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Nome *</Label>
          <Input
            placeholder="Ex: Vendas iNexaHub"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Departamento</Label>
          <Input
            placeholder="SUPORTE / VENDAS"
            value={form.departamento}
            onChange={(e) => setForm({ ...form, departamento: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Categoria</Label>
        <Input
          placeholder="vendas / suporte / billing"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Descrição (interna)</Label>
        <Input
          placeholder="Ex: Realiza atendimento"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoAgente })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worker">Worker (atende o cliente)</SelectItem>
              <SelectItem value="orchestrator">Orquestrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Reporta a (chefe direto)</Label>
          <Select
            value={form.parent_id || 'none'}
            onValueChange={(v) => setForm({ ...form, parent_id: v === 'none' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Raiz / sem chefe —</SelectItem>
              {parentOptions.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Modelo *</Label>
        <Select value={form.modelo} onValueChange={(v) => setForm({ ...form, modelo: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {MODELO_GROUPS.map((group) => (
              <div key={group}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </div>
                {AGENTE_MODELOS.filter((m) => m.group === group).map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>System prompt *</Label>
        <Textarea
          rows={5}
          value={form.system_prompt}
          onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label>Criatividade ({form.temperatura})</Label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={form.temperatura}
          onChange={(e) => setForm({ ...form, temperatura: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}

export function AgenteCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: agentes = [] } = useOcAgentesQuery();
  const criar = useOcAgenteCreate();
  const [form, setForm] = useState<AgenteFormState>(DEFAULT_FORM);

  const handleSubmit = () => {
    criar.mutate(
      {
        ...form,
        parent_id: form.parent_id || undefined,
        system_prompt: form.system_prompt,
      },
      {
        onSuccess: () => {
          onClose();
          setForm(DEFAULT_FORM);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo agente</DialogTitle>
        </DialogHeader>
        <AgenteFormFields form={form} setForm={setForm} agentes={agentes} mode="create" />
        <p className="text-xs text-muted-foreground">
          Após criar, clique no card do agente no organograma para vincular skills e canais.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.nome || !form.system_prompt || criar.isPending}
          >
            Criar agente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AgenteEditModal({
  open,
  onClose,
  agenteId,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  agenteId: string | null;
  onDeleted?: () => void;
}) {
  const { data: agentes = [] } = useOcAgentesQuery();
  const { data: agente, isLoading } = useOcAgenteQuery(agenteId, open);
  const patch = useOcAgentePatch();
  const deletar = useOcAgenteDelete();
  const [form, setForm] = useState<AgenteFormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!agente) return;
    setForm({
      nome: agente.nome,
      descricao: agente.descricao ?? '',
      tipo: agente.tipo,
      categoria: agente.categoria ?? '',
      departamento: agente.departamento ?? '',
      modelo: agente.modelo,
      system_prompt: agente.system_prompt,
      contexto_operacional: agente.contexto_operacional ?? '',
      temperatura: agente.temperatura,
      parent_id: agente.parent_id ?? '',
      squad: agente.squad ?? '',
    });
  }, [agente]);

  const handleSubmit = () => {
    if (!agenteId) return;
    patch.mutate(
      {
        id: agenteId,
        nome: form.nome,
        descricao: form.descricao.trim() || undefined,
        tipo: form.tipo,
        categoria: form.categoria.trim() || undefined,
        departamento: form.departamento.trim() || undefined,
        squad: form.squad.trim() || undefined,
        modelo: form.modelo,
        system_prompt: form.system_prompt,
        contexto_operacional: form.contexto_operacional.trim() || undefined,
        temperatura: form.temperatura,
        parent_id: form.parent_id || null,
      },
      { onSuccess: () => onClose() },
    );
  };

  const handleDelete = () => {
    if (!agenteId) return;
    if (!confirm(`Excluir o agente "${form.nome}"? Subordinados ficarão sem chefe direto.`)) return;
    deletar.mutate(agenteId, {
      onSuccess: () => {
        onDeleted?.();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Editar agente</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <>
              <AgenteFormFields
                form={form}
                setForm={setForm}
                agentes={agentes}
                excludeAgenteId={agenteId ?? undefined}
                mode="edit"
              />
              {agenteId && (
                <>
                  <OcAgenteSkillsSection agenteId={agenteId} />
                  <div className="border-t pt-4">
                    <OcAgenteCanaisSection agenteId={agenteId} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={!agenteId || deletar.isPending || isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.nome || !form.system_prompt || patch.isPending || isLoading}
            >
              {patch.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
