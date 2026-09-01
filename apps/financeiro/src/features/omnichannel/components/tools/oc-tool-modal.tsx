'use client';

import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOcToolCreate, useOcToolPatch } from '@/features/omnichannel/hooks/use-oc-api';
import type { OcTool, TipoTool } from '@/features/omnichannel/types';

type Props = {
  open: boolean;
  onClose: () => void;
  tool?: OcTool | null;
};

type FormState = {
  nome: string;
  descricao: string;
  base_url: string;
  headers: string;
  connection_ref: string;
};

const emptyForm = (): FormState => ({
  nome: '',
  descricao: '',
  base_url: '',
  headers: '{}',
  connection_ref: '',
});

function toolToForm(tool: OcTool): FormState {
  const cfg = tool.config ?? {};
  return {
    nome: tool.nome,
    descricao: tool.descricao ?? '',
    base_url: typeof cfg.base_url === 'string' ? cfg.base_url : '',
    headers: JSON.stringify(cfg.headers ?? {}, null, 2),
    connection_ref: typeof cfg.connection_ref === 'string' ? cfg.connection_ref : '',
  };
}

const TIPO_LABELS: Record<TipoTool, string> = {
  http_api: 'HTTP API',
  sql_postgres: 'SQL Postgres',
  internal: 'Internal (Python)',
};

export function OcToolModal({ open, onClose, tool }: Props) {
  const isEdit = !!tool;
  const criar = useOcToolCreate();
  const atualizar = useOcToolPatch();

  const [tipo, setTipo] = useState<'http_api' | 'sql_postgres'>('http_api');
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (!open) return;
    if (tool) {
      setForm(toolToForm(tool));
    } else {
      setTipo('http_api');
      setForm(emptyForm());
    }
  }, [open, tool]);

  const handleClose = (v: boolean) => {
    if (!v) onClose();
  };

  const buildConfig = () => {
    if (isEdit && tool?.tipo === 'internal') {
      return tool.config ?? {};
    }
    const effectiveTipo = isEdit ? tool!.tipo : tipo;
    if (effectiveTipo === 'http_api') {
      return {
        base_url: form.base_url,
        headers: JSON.parse(form.headers || '{}'),
      };
    }
    return { connection_ref: form.connection_ref };
  };

  const handleSubmit = () => {
    try {
      const config = buildConfig();
      if (isEdit && tool) {
        atualizar.mutate(
          {
            id: tool.id,
            nome: form.nome,
            descricao: form.descricao || undefined,
            config,
          },
          { onSuccess: () => handleClose(false) },
        );
      } else {
        criar.mutate(
          { nome: form.nome, descricao: form.descricao, tipo, config },
          { onSuccess: () => handleClose(false) },
        );
      }
    } catch {
      // JSON.parse em headers
    }
  };

  const effectiveTipo: TipoTool = isEdit ? tool!.tipo : tipo;
  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tool' : 'Nova tool (conexão)'}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">Conexão reutilizável entre várias skills</p>

        {isEdit ? (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Badge variant="outline" className="uppercase">
              {TIPO_LABELS[effectiveTipo]}
            </Badge>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(['http_api', 'sql_postgres'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  tipo === t ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                {t === 'http_api' ? (
                  <>
                    <div className="font-medium">HTTP API</div>
                    <div className="text-xs text-muted-foreground">REST com auth</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">SQL Postgres</div>
                    <div className="text-xs text-muted-foreground">Query num banco</div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input
              placeholder="Trivapp"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          {effectiveTipo === 'internal' ? (
            <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Tools internas são provisionadas pelo sistema. Apenas nome e descrição podem ser
              editados.
            </p>
          ) : effectiveTipo === 'http_api' ? (
            <>
              <div className="space-y-1">
                <Label>Base URL</Label>
                <Input
                  placeholder="https://api.trivapp.com.br/api/v1"
                  value={form.base_url}
                  onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Headers padrão (JSON)</Label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={form.headers}
                  onChange={(e) => setForm({ ...form, headers: e.target.value })}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <Label>Connection ref (env var)</Label>
              <Input
                placeholder="HOTWEBINAR_DB_URL"
                value={form.connection_ref}
                onChange={(e) => setForm({ ...form, connection_ref: e.target.value })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.nome || isPending}>
            {isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
