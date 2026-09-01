'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useOcCanaisQuery,
  useOcInboxCreate,
  useOcInboxUpdate,
  useOcTagsQuery,
} from '@/features/omnichannel/hooks/use-oc-api';
import type { OcInbox, OcInboxFiltros } from '@/features/omnichannel/types';
import { useOcStore } from '@/stores/use-oc-store';
import { cn } from '@/lib/utils';
import {
  INBOX_ATRIBUICAO_OPTIONS,
  INBOX_COLOR_OPTIONS,
  INBOX_ICON_OPTIONS,
  INBOX_STATUS_OPTIONS,
  INBOX_TIPO_CONVERSA_OPTIONS,
} from './oc-inbox-constants';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inbox?: OcInbox | null;
};

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function OcInboxCreateDialog({ open, onOpenChange, inbox }: Props) {
  const { slug } = useOcBasePath();

  const router = useRouter();
  const setFiltros = useOcStore((s) => s.setFiltros);
  const { data: canaisData } = useOcCanaisQuery();
  const { data: tagsData } = useOcTagsQuery();
  const criar = useOcInboxCreate();
  const atualizar = useOcInboxUpdate();
  const isEdit = Boolean(inbox);

  const canais = canaisData ?? [];
  const tags = tagsData ?? [];

  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState('inbox');
  const [cor, setCor] = useState('gray');
  const [canaisSelecionados, setCanaisSelecionados] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [atribuicao, setAtribuicao] = useState('qualquer');
  const [tipoConversa, setTipoConversa] = useState('todas');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);

  const reset = () => {
    setNome('');
    setIcone('inbox');
    setCor('gray');
    setCanaisSelecionados([]);
    setStatuses([]);
    setAtribuicao('qualquer');
    setTipoConversa('todas');
    setTagsSelecionadas([]);
  };

  useEffect(() => {
    if (!open) return;
    if (inbox) {
      const f = inbox.filtros ?? {};
      setNome(inbox.nome);
      setIcone(inbox.icone);
      setCor(inbox.cor);
      setCanaisSelecionados(f.canal_ids ?? []);
      setStatuses(f.statuses ?? []);
      setAtribuicao(f.atribuicao ?? 'qualquer');
      setTipoConversa(f.tipo_conversa ?? 'todas');
      setTagsSelecionadas(f.tags ?? []);
    } else {
      reset();
    }
  }, [open, inbox?.id]);

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const toggleCanal = (id: string) => {
    setCanaisSelecionados((prev) => toggleInList(prev, id));
  };

  const buildPayload = () => {
    const trimmed = nome.trim();
    if (!trimmed) {
      toast.error('Informe o nome da inbox');
      return null;
    }

    const filtros: OcInboxFiltros = {
      atribuicao,
      tipo_conversa: tipoConversa,
    };
    if (canaisSelecionados.length > 0) filtros.canal_ids = canaisSelecionados;
    if (statuses.length > 0) filtros.statuses = statuses;
    if (tagsSelecionadas.length > 0) filtros.tags = tagsSelecionadas;

    return { nome: trimmed, icone, cor, filtros };
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) return;

    if (isEdit && inbox) {
      atualizar.mutate(
        { inboxId: inbox.id, body: payload },
        {
          onSuccess: () => {
            toast.success('Inbox atualizada');
            handleClose(false);
          },
          onError: () => toast.error('Não foi possível atualizar a inbox'),
        },
      );
      return;
    }

    criar.mutate(payload, {
      onSuccess: (created) => {
        toast.success('Inbox criada');
        setFiltros({
          canalFiltro: null,
          customInboxId: created.id,
          atribuicaoFiltro: 'todas',
          buscaTexto: '',
          filtroNaoLidas: false,
          filtroArquivadas: false,
          filtroGrupos: false,
          tagsFiltro: [],
        });
        router.push(`/org/${slug}/omnichannel/inbox?inbox=${created.id}`);
        handleClose(false);
      },
      onError: () => toast.error('Não foi possível criar a inbox'),
    });
  };

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{isEdit ? 'Editar inbox' : 'Nova inbox'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="inbox-nome">Nome</Label>
            <Input
              id="inbox-nome"
              placeholder="ex: Vendas WhatsApp"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-5 gap-2">
              {INBOX_ICON_OPTIONS.map(({ key, icon: Icon }) => {
                const selected = icone === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcone(key)}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-lg border transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-3">
              {INBOX_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCor(c.key)}
                  className={cn(
                    'h-7 w-7 rounded-full',
                    c.swatch,
                    cor === c.key ? cn('ring-2 ring-offset-2', c.ring) : 'opacity-90 hover:opacity-100',
                  )}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Filtros
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Canais (todos)</Label>
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {canais.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum canal conectado.</p>
                  ) : (
                    canais.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md py-1"
                      >
                        <Checkbox
                          checked={canaisSelecionados.includes(c.id)}
                          onCheckedChange={() => toggleCanal(c.id)}
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium">{c.nome}</span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {c.tipo.toUpperCase().replace(/_/g, '_').slice(0, 10)}…
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {INBOX_STATUS_OPTIONS.map((s) => {
                    const active = statuses.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStatuses((prev) => toggleInList(prev, s.value))}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Vazio = todos os status.</p>
              </div>

              <div className="space-y-2">
                <Label>Atribuição</Label>
                <Select value={atribuicao} onValueChange={setAtribuicao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INBOX_ATRIBUICAO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de conversa</Label>
                <div className="flex flex-wrap gap-2">
                  {INBOX_TIPO_CONVERSA_OPTIONS.map((o) => {
                    const active = tipoConversa === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setTipoConversa(o.value)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (nenhuma — todas)</Label>
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tag cadastrada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => {
                      const active = tagsSelecionadas.includes(t.nome);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setTagsSelecionadas((prev) => toggleInList(prev, t.nome))
                          }
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <span
                            className="h-2 w-2 rounded-full bg-blue-500"
                            style={{
                              backgroundColor:
                                t.cor === 'blue'
                                  ? '#3b82f6'
                                  : t.cor === 'green'
                                    ? '#22c55e'
                                    : t.cor === 'red'
                                      ? '#ef4444'
                                      : '#94a3b8',
                            }}
                          />
                          {t.nome}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Conversa entra se tiver QUALQUER uma das tags marcadas (na conversa ou no
                  contato).
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEdit
                ? 'Salvando...'
                : 'Criando...'
              : isEdit
                ? 'Salvar'
                : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
