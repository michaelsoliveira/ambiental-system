'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useOcSkillCreate,
  useOcSkillPatch,
  useOcToolsQuery,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { OcSkill, OcSkillInvocationConfig } from '@/features/omnichannel/types';

const DEFAULT_SCHEMA = `{
  "type": "object",
  "required": ["email"],
  "properties": {
    "email": {
      "type": "string",
      "description": "E-mail do cliente"
    }
  }
}`;

const DEFAULT_BODY = `{
  "email": "{{input.email}}"
}`;

const NOME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

type Props = {
  open: boolean;
  onClose: () => void;
  skill?: OcSkill | null;
};

type FormState = {
  nome: string;
  categoria: string;
  descricao_llm: string;
  tool_id: string;
  parameters_schema: string;
  method: string;
  path: string;
  headers_extras: string;
  body_template: string;
  response_mapping: string;
  instrucoes_extras: string;
  timeout_ms: number;
  ativo: boolean;
};

const emptyForm = (): FormState => ({
  nome: '',
  categoria: '',
  descricao_llm: '',
  tool_id: '',
  parameters_schema: DEFAULT_SCHEMA,
  method: 'POST',
  path: '',
  headers_extras: '{}',
  body_template: DEFAULT_BODY,
  response_mapping: '',
  instrucoes_extras: '',
  timeout_ms: 15000,
  ativo: true,
});

function skillToForm(skill: OcSkill): FormState {
  const inv = skill.invocation_config ?? {};
  return {
    nome: skill.nome,
    categoria: skill.categoria ?? '',
    descricao_llm: skill.descricao_llm,
    tool_id: skill.tool_id ?? '',
    parameters_schema: JSON.stringify(skill.parameters_schema ?? {}, null, 2),
    method: String(inv.method ?? 'POST'),
    path: String(inv.path ?? ''),
    headers_extras: JSON.stringify(inv.headers ?? {}, null, 2),
    body_template: inv.body_template
      ? JSON.stringify(inv.body_template, null, 2)
      : DEFAULT_BODY,
    response_mapping: inv.response_mapping
      ? JSON.stringify(inv.response_mapping, null, 2)
      : '',
    instrucoes_extras: skill.instrucoes_extras ?? '',
    timeout_ms: skill.timeout_ms,
    ativo: skill.ativo,
  };
}

function parseJsonField(
  raw: string,
  label: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, error: `${label}: JSON inválido` };
  }
}

function toolLabel(nome: string, tipo: string) {
  const short =
    tipo === 'http_api' ? 'HTTP' : tipo === 'sql_postgres' ? 'SQL' : tipo === 'internal' ? 'Internal' : tipo;
  return `${nome} (${short})`;
}

export function OcSkillModal({ open, onClose, skill }: Props) {
  const { slug } = useOcBasePath();

  const isEdit = !!skill;
  const criar = useOcSkillCreate();
  const atualizar = useOcSkillPatch();
  const { data: tools = [] } = useOcToolsQuery();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(skill ? skillToForm(skill) : emptyForm());
    setErrors({});
  }, [open, skill]);

  const selectedTool = useMemo(
    () => tools.find((t) => t.id === form.tool_id),
    [tools, form.tool_id],
  );

  const isHttpTool = selectedTool?.tipo === 'http_api';
  const isInternalTool = selectedTool?.tipo === 'internal';

  const baseUrl = useMemo(() => {
    const url = selectedTool?.config?.base_url;
    return typeof url === 'string' ? url.replace(/\/$/, '') : '';
  }, [selectedTool]);

  const handleClose = (v: boolean) => {
    if (!v) onClose();
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.nome.trim()) nextErrors.nome = 'Obrigatório';
    else if (!NOME_REGEX.test(form.nome.trim())) {
      nextErrors.nome = 'Use só letras, dígitos e underscore (ex: resetPassword)';
    }
    if (!form.descricao_llm.trim()) nextErrors.descricao_llm = 'Obrigatório';

    const schema = parseJsonField(form.parameters_schema, 'Parameters');
    if (!schema.ok) nextErrors.parameters_schema = schema.error;

    let headersExtras: Record<string, unknown> = {};
    if (form.headers_extras.trim()) {
      const h = parseJsonField(form.headers_extras, 'Headers');
      if (!h.ok) nextErrors.headers_extras = h.error;
      else headersExtras = h.value as Record<string, unknown>;
    }

    let bodyTemplate: unknown = undefined;
    if (isHttpTool && form.body_template.trim()) {
      const b = parseJsonField(form.body_template, 'Body template');
      if (!b.ok) nextErrors.body_template = b.error;
      else bodyTemplate = b.value;
    }

    let responseMapping: Record<string, string> | undefined;
    if (form.response_mapping.trim()) {
      const r = parseJsonField(form.response_mapping, 'Response mapping');
      if (!r.ok) nextErrors.response_mapping = r.error;
      else responseMapping = r.value as Record<string, string>;
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    if (!schema.ok) return;
    setErrors({});

    const invocation_config: OcSkillInvocationConfig = isHttpTool
      ? {
          method: form.method,
          path: form.path.trim(),
          headers: headersExtras,
          ...(bodyTemplate !== undefined && bodyTemplate !== null
            ? { body_template: bodyTemplate as OcSkillInvocationConfig['body_template'] }
            : {}),
          ...(responseMapping ? { response_mapping: responseMapping } : {}),
        }
      : isEdit && skill?.invocation_config?.handler
        ? { handler: skill.invocation_config.handler }
        : {};

    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || undefined,
      descricao_llm: form.descricao_llm.trim(),
      tool_id: form.tool_id || undefined,
      parameters_schema: schema.value as Record<string, unknown>,
      invocation_config,
      instrucoes_extras: form.instrucoes_extras.trim() || undefined,
      timeout_ms: form.timeout_ms,
      ...(isEdit ? { ativo: form.ativo } : {}),
    };

    if (isEdit && skill) {
      atualizar.mutate({ id: skill.id, ...payload }, { onSuccess: () => handleClose(false) });
    } else {
      criar.mutate(payload, { onSuccess: () => handleClose(false) });
    }
  };

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar skill' : 'Nova skill'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Função que o LLM pode chamar (ex: <code className="text-xs">resetPassword</code>).
            Vincule a uma{' '}
            <Link
              href={`/org/${slug}/omnichannel/tools`}
              className="text-primary underline-offset-2 hover:underline"
            >
              Tool
            </Link>{' '}
            cadastrada antes.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Ativa</Label>
                <p className="text-xs text-muted-foreground">Skills inativas não são expostas ao LLM</p>
              </div>
              <Switch
                checked={form.ativo}
                onCheckedChange={(ativo) => setForm({ ...form, ativo })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome (function name) *</Label>
              <Input
                placeholder="resetPassword"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">só letras/dígitos/underscore</p>
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input
                placeholder="pos-venda"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição (pra LLM) *</Label>
            <Textarea
              rows={3}
              placeholder="Gera nova senha aleatória e envia por e-mail. Use quando o cliente esqueceu/perdeu a senha."
              value={form.descricao_llm}
              onChange={(e) => setForm({ ...form, descricao_llm: e.target.value })}
            />
            {errors.descricao_llm && (
              <p className="text-xs text-destructive">{errors.descricao_llm}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tool (provider)</Label>
            <Select
              value={form.tool_id || 'none'}
              onValueChange={(v) => setForm({ ...form, tool_id: v === 'none' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="— selecione —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— selecione —</SelectItem>
                {tools.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {toolLabel(t.nome, t.tipo)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tools.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhuma tool cadastrada — crie em Omnichannel → Tools primeiro.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Parameters (JSON Schema)</Label>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              value={form.parameters_schema}
              onChange={(e) => setForm({ ...form, parameters_schema: e.target.value })}
            />
            {errors.parameters_schema && (
              <p className="text-xs text-destructive">{errors.parameters_schema}</p>
            )}
          </div>

          {isInternalTool && (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              Handler interno:{' '}
              <code className="font-mono">
                {String(skill?.invocation_config?.handler ?? form.nome)}
              </code>
              <p className="mt-1">Definido no provisionamento — não editável aqui.</p>
            </div>
          )}

          {isHttpTool && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                HTTP Invocation
              </p>
              <div className="grid grid-cols-[100px_1fr] gap-3">
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Path</Label>
                  <Input
                    placeholder="/admin/actions/reset-password"
                    value={form.path}
                    onChange={(e) => setForm({ ...form, path: e.target.value })}
                    className="font-mono text-sm"
                  />
                  {baseUrl && (
                    <p className="text-[11px] text-muted-foreground">
                      Concatenado a: <span className="font-mono">{baseUrl}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Headers extras (opcional, JSON)</Label>
                <Textarea
                  rows={3}
                  className="font-mono text-xs"
                  placeholder='{"X-Custom": "valor"}'
                  value={form.headers_extras}
                  onChange={(e) => setForm({ ...form, headers_extras: e.target.value })}
                />
                {errors.headers_extras && (
                  <p className="text-xs text-destructive">{errors.headers_extras}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Body template</Label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={form.body_template}
                  onChange={(e) => setForm({ ...form, body_template: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Variáveis: <code className="text-xs">{'{{input.x}}'}</code>,{' '}
                  <code className="text-xs">{'{{ctx.x}}'}</code>,{' '}
                  <code className="text-xs">{'{{env.VAR}}'}</code>
                </p>
                {errors.body_template && (
                  <p className="text-xs text-destructive">{errors.body_template}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Response mapping (opcional)</Label>
                <Textarea
                  rows={2}
                  className="font-mono text-xs"
                  placeholder='{"ok": "$.success"}'
                  value={form.response_mapping}
                  onChange={(e) => setForm({ ...form, response_mapping: e.target.value })}
                />
                {errors.response_mapping && (
                  <p className="text-xs text-destructive">{errors.response_mapping}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Instruções extras (opcional, vão pro system prompt)</Label>
            <Textarea
              rows={2}
              placeholder="Sempre rode checkPurchase antes de prometer ações..."
              value={form.instrucoes_extras}
              onChange={(e) => setForm({ ...form, instrucoes_extras: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              min={1000}
              step={1000}
              value={form.timeout_ms}
              onChange={(e) => setForm({ ...form, timeout_ms: Number(e.target.value) })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.nome || !form.descricao_llm || isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            {isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
