'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import { useMemo } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { OcCanalListItem } from '@/features/omnichannel/types';
import { useOcCanaisQuery, useOcCanalPatch } from '@/features/omnichannel/hooks/use-oc-api';

type Props = {
  agenteId: string;
};

function canalTipoLabel(canal: OcCanalListItem): string {
  const provider = canal.provider ?? canal.tipo;
  if (provider === 'evolution' || canal.tipo === 'whatsapp_evolution') {
    return 'WHATSAPP_EVOLUTION';
  }
  return String(provider).toUpperCase().replace(/-/g, '_');
}

function agenteRoleInCanal(canal: OcCanalListItem, agenteId: string): string | null {
  const cfg = canal.config ?? {};
  if (cfg.agente_orquestrador_id === agenteId) return 'orquestrador';
  if (cfg.agente_worker_id === agenteId) return 'worker';
  return null;
}

export function OcAgenteCanaisSection({ agenteId }: Props) {
  const { slug } = useOcBasePath();

  const { data: canais = [] as OcCanalListItem[], isLoading } = useOcCanaisQuery();
  const patch = useOcCanalPatch();

  const linked = useMemo(
    () =>
      canais
        .map((c: OcCanalListItem) => ({ canal: c, role: agenteRoleInCanal(c, agenteId) }))
        .filter((x): x is { canal: OcCanalListItem; role: string } => !!x.role),
    [canais, agenteId],
  );

  const handleUnlink = (canal: OcCanalListItem) => {
    const cfg = { ...(canal.config ?? {}) };
    if (cfg.agente_orquestrador_id === agenteId) delete cfg.agente_orquestrador_id;
    if (cfg.agente_worker_id === agenteId) delete cfg.agente_worker_id;
    patch.mutate({ id: canal.id, config: cfg });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Canais</p>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando canais…</p>
      ) : linked.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum canal vinculado. Associe este agente em{' '}
          <Link
            href={`/org/${slug}/omnichannel/configuracoes`}
            className="text-primary underline-offset-2 hover:underline"
          >
            Configurações → Canais
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {linked.map(({ canal, role }) => (
            <div
              key={canal.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{canal.nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {canalTipoLabel(canal)} · {role}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleUnlink(canal)}
                disabled={patch.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
