'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ConditionRule = { field: string; operator: string; value: string };
export type ConditionGroup = { group: 'TODAS' | 'QUALQUER'; rules: ConditionRule[] };

const OPERATORS = [
  { value: 'eq', label: 'é igual a' },
  { value: 'ne', label: 'é diferente de' },
  { value: 'contains', label: 'contém' },
  { value: 'in', label: 'está em (lista)' },
  { value: 'empty', label: 'está vazio' },
  { value: 'not_empty', label: 'não está vazio' },
] as const;

const STATUS_OPTS = ['bot', 'pending', 'open', 'closed', 'snoozed'];

const FIELDS_BY_TRIGGER: Record<string, { value: string; label: string }[]> = {
  mensagem_recebida: [
    { value: 'mensagem', label: 'Mensagem' },
    { value: 'status', label: 'Status atual' },
    { value: 'tag', label: 'Tag da conversa' },
  ],
  status_mudou: [
    { value: 'status_anterior', label: 'Status anterior' },
    { value: 'status_novo', label: 'Novo status' },
  ],
  tag_adicionada: [
    { value: 'tag', label: 'Tag adicionada' },
    { value: 'status', label: 'Status atual' },
  ],
  tag_removida: [
    { value: 'tag', label: 'Tag removida' },
    { value: 'status', label: 'Status atual' },
  ],
  conversa_atribuida: [
    { value: 'atendente_id', label: 'Atendente (UUID)' },
    { value: 'status', label: 'Status atual' },
  ],
};

const emptyRule = (): ConditionRule => ({ field: 'mensagem', operator: 'contains', value: '' });
const emptyGroup = (trigger: string): ConditionGroup => {
  const fields = FIELDS_BY_TRIGGER[trigger] ?? [{ value: 'status', label: 'Status' }];
  return { group: 'TODAS', rules: [{ ...emptyRule(), field: fields[0].value }] };
};

type Props = {
  trigger: string;
  value: ConditionGroup[];
  onChange: (groups: ConditionGroup[]) => void;
};

export function OcCondicoesEditor({ trigger, value, onChange }: Props) {
  const groups = value.length ? value : [];
  const fields = FIELDS_BY_TRIGGER[trigger] ?? [{ value: 'status', label: 'Status' }];

  const updateGroup = (idx: number, patch: Partial<ConditionGroup>) => {
    onChange(groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const updateRule = (gIdx: number, rIdx: number, patch: Partial<ConditionRule>) => {
    onChange(
      groups.map((g, i) =>
        i === gIdx
          ? { ...g, rules: g.rules.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)) }
          : g,
      ),
    );
  };

  const addGroup = () => onChange([...groups, emptyGroup(trigger)]);
  const removeGroup = (idx: number) => onChange(groups.filter((_, i) => i !== idx));

  const addRule = (gIdx: number) => {
    const f = fields[0]?.value ?? 'status';
    updateGroup(gIdx, {
      rules: [...groups[gIdx].rules, { field: f, operator: 'eq', value: '' }],
    });
  };

  const removeRule = (gIdx: number, rIdx: number) => {
    const rules = groups[gIdx].rules.filter((_, i) => i !== rIdx);
    if (!rules.length) {
      removeGroup(gIdx);
      return;
    }
    updateGroup(gIdx, { rules });
  };

  const needsValue = (op: string) => !['empty', 'not_empty'].includes(op);
  const isStatusField = (field: string) =>
    ['status', 'status_novo', 'status_anterior'].includes(field);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium uppercase text-muted-foreground">
          Condições (opcional)
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addGroup}>
          <Plus className="mr-1 h-3 w-3" /> Grupo
        </Button>
      </div>

      {!groups.length && (
        <p className="text-xs text-muted-foreground">
          Sem grupos — a automação dispara sempre que o trigger ocorrer. Adicione um grupo para
          filtrar (qualquer grupo que passar executa a automação).
        </p>
      )}

      {groups.map((grupo, gIdx) => (
        <div key={gIdx} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Select
              value={grupo.group}
              onValueChange={(v) => updateGroup(gIdx, { group: v as 'TODAS' | 'QUALQUER' })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">TODAS as regras</SelectItem>
                <SelectItem value="QUALQUER">QUALQUER regra</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">neste grupo</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => removeGroup(gIdx)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {grupo.rules.map((rule, rIdx) => (
            <div key={rIdx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <Select value={rule.field} onValueChange={(v) => updateRule(gIdx, rIdx, { field: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={rule.operator}
                onValueChange={(v) => updateRule(gIdx, rIdx, { operator: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {needsValue(rule.operator) ? (
                isStatusField(rule.field) ? (
                  <Select
                    value={rule.value || '_any'}
                    onValueChange={(v) =>
                      updateRule(gIdx, rIdx, { value: v === '_any' ? '' : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Valor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_any">—</SelectItem>
                      {STATUS_OPTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Valor"
                    value={rule.value}
                    onChange={(e) => updateRule(gIdx, rIdx, { value: e.target.value })}
                  />
                )
              ) : (
                <div className="flex items-center text-xs text-muted-foreground">—</div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRule(gIdx, rIdx)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={() => addRule(gIdx)}>
            <Plus className="mr-1 h-3 w-3" /> Regra
          </Button>
        </div>
      ))}
    </div>
  );
}

export function sanitizeConditionGroups(groups: ConditionGroup[]): ConditionGroup[] {
  return groups
    .map((g) => ({
      group: g.group,
      rules: g.rules.filter(
        (r) =>
          r.field &&
          r.operator &&
          (['empty', 'not_empty'].includes(r.operator) || r.value.trim()),
      ),
    }))
    .filter((g) => g.rules.length > 0);
}
