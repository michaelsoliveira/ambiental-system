'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Copy,
  EyeOff,
  LayoutTemplate,
  MessageCircle,
  MoreVertical,
  QrCode,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { OcCanalListItem } from '@/features/omnichannel/types';
import {
  useOcCanalDelete,
  useOcCanalPatch,
  useOcCanalQrQuery,
  useOcCanalSync,
  useOcCanalTest,
} from '@/features/omnichannel/hooks/use-oc-api';

type Props = {
  canal: OcCanalListItem;
};

function isConnected(status?: string) {
  return status === 'open' || status === 'connected';
}

function providerLabel(canal: OcCanalListItem) {
  if (canal.tipo === 'whatsapp_evolution') {
    return 'WhatsApp (Evolution API)';
  }
  if (canal.tipo === 'landing_form') {
    return 'Formulário da landing';
  }
  return canal.tipo.replace(/_/g, ' ');
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copiado!'),
    () => toast.error('Não foi possível copiar'),
  );
}

function confirmExcluirCanal(nome: string) {
  return window.confirm(
    `Excluir o canal "${nome}"?\n\nIsso remove a inbox vinculada e as conversas deste canal. Esta ação não pode ser desfeita.`,
  );
}

function QrDisplay({ value }: { value: string }) {
  if (value.startsWith('data:image')) {
    return (
      <img
        src={value}
        alt="QR Code WhatsApp"
        className="mx-auto h-44 w-44 object-contain"
      />
    );
  }
  return (
    <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-lg bg-muted p-3 text-center text-[10px] text-muted-foreground break-all">
      {value}
    </div>
  );
}

function LandingFormCard({ canal }: Props) {
  const patch = useOcCanalPatch();
  const excluir = useOcCanalDelete();

  const handleDesativar = () => {
    patch.mutate(
      { id: canal.id, ativo: false },
      { onSuccess: () => toast.success('Canal desativado') },
    );
  };

  const handleAtivar = () => {
    patch.mutate(
      { id: canal.id, ativo: true },
      { onSuccess: () => toast.success('Canal ativado') },
    );
  };

  const handleExcluir = () => {
    if (!confirmExcluirCanal(canal.nome)) return;
    excluir.mutate(canal.id);
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-primary/10">
            <LayoutTemplate className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{canal.nome}</h3>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-medium',
                  canal.ativo
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'text-muted-foreground',
                )}
              >
                {canal.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{providerLabel(canal)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canal.ativo ? (
              <DropdownMenuItem onClick={handleDesativar}>Desativar canal</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleAtivar}>Reativar canal</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleExcluir}
              disabled={excluir.isPending}
            >
              Excluir canal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {canal.ingest_url ? (
        <div className="mt-3 rounded-lg border border-dashed bg-muted/20 p-3">
          <p className="mb-1.5 text-[11px] text-muted-foreground">
            Endpoint de ingestão (configure na landing):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-[11px]">{canal.ingest_url}</code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => copyText(canal.ingest_url!)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Secret: use o valor gerado na criação do canal (
            <code>OMNICHANNEL_INGEST_SECRET</code>).
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {canal.ativo ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={handleDesativar}
            disabled={patch.isPending}
          >
            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            Desativar
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={handleAtivar}
            disabled={patch.isPending}
          >
            Reativar
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 flex-1 text-xs text-destructive hover:text-destructive"
          onClick={handleExcluir}
          disabled={excluir.isPending}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

function WhatsappCanalCard({ canal }: Props) {
  const sync = useOcCanalSync();
  const testar = useOcCanalTest();
  const patch = useOcCanalPatch();
  const excluir = useOcCanalDelete();
  const [qrRequested, setQrRequested] = useState(false);

  const connected = isConnected(canal.instance_status);
  const canShowQrActions = canal.ativo && !connected;

  const { data: qrData, refetch: refetchQr, isFetching: qrLoading } = useOcCanalQrQuery(
    canal.id,
    qrRequested && canShowQrActions,
  );

  useEffect(() => {
    if (connected) setQrRequested(false);
  }, [connected]);

  useEffect(() => {
    if (!qrRequested || !canShowQrActions) return;
    const interval = setInterval(() => refetchQr(), 120_000);
    return () => clearInterval(interval);
  }, [qrRequested, canShowQrActions, refetchQr]);

  const handleGerarQr = () => {
    if (qrRequested) {
      void refetchQr();
      return;
    }
    setQrRequested(true);
  };

  const handleSync = () => {
    sync.mutate(canal.id, {
      onSuccess: (res: any) => {
        if (res.ok) {
          toast.success(
            res.status === 'open' || res.status === 'connected'
              ? 'Status sincronizado — conexão ativa'
              : 'Status sincronizado',
          );
        } else {
          toast.error(`Sync falhou: ${res.error ?? 'erro desconhecido'}`);
        }
      },
    });
  };

  const handleTest = () => {
    testar.mutate(canal.id, {
      onSuccess: (res: any) => {
        if (res.ok) toast.success(res.message ?? 'Conexão ativa');
        else toast.error(res.message ?? 'Conexão inativa');
      },
    });
  };

  const handleDesativar = () => {
    patch.mutate(
      { id: canal.id, ativo: false },
      { onSuccess: () => toast.success('Canal desativado') },
    );
  };

  const handleAtivar = () => {
    patch.mutate(
      { id: canal.id, ativo: true },
      { onSuccess: () => toast.success('Canal ativado') },
    );
  };

  const handleExcluir = () => {
    if (!confirmExcluirCanal(canal.nome)) return;
    excluir.mutate(canal.id);
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/50">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{canal.nome}</h3>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-medium',
                  canal.ativo && connected
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : canal.ativo
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'text-muted-foreground',
                )}
              >
                {canal.ativo ? (connected ? 'Ativo' : 'Aguardando QR') : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{providerLabel(canal)}</p>
            {canal.phone && (
              <p className="text-[11px] text-muted-foreground">{canal.phone}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canal.ativo ? (
              <DropdownMenuItem onClick={handleDesativar}>Desativar canal</DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleAtivar}>Reativar canal</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleExcluir}
              disabled={excluir.isPending}
            >
              Excluir canal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {canal.sync_error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Sync falhou: {canal.sync_error}</span>
        </div>
      )}

      {qrRequested && canShowQrActions && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/20 py-4">
          {qrLoading && !qrData?.qrcode ? (
            <p className="text-xs text-muted-foreground">Gerando QR Code…</p>
          ) : qrData?.qrcode ? (
            <QrDisplay value={qrData.qrcode} />
          ) : (
            <p className="px-4 text-center text-xs text-muted-foreground">
              QR Code indisponível. Tente gerar novamente ou use Sincronizar.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Escaneie com o WhatsApp para conectar
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canShowQrActions && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={handleGerarQr}
            disabled={qrLoading}
          >
            <QrCode className="mr-1.5 h-3.5 w-3.5" />
            {qrLoading ? 'Gerando QR Code…' : 'Gerar QR Code'}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={handleTest}
          disabled={testar.isPending || !canal.ativo}
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          Testar Conexão
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 flex-1 text-xs"
          onClick={handleSync}
          disabled={sync.isPending || !canal.ativo}
        >
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', sync.isPending && 'animate-spin')} />
          Sincronizar
        </Button>
        {canal.ativo ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={handleDesativar}
            disabled={patch.isPending}
          >
            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            Desativar
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={handleAtivar}
            disabled={patch.isPending}
          >
            Reativar
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 flex-1 text-xs text-destructive hover:text-destructive"
          onClick={handleExcluir}
          disabled={excluir.isPending}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

export function OcCanalCard({ canal }: Props) {
  if (canal.tipo === 'landing_form') {
    return <LandingFormCard canal={canal} />;
  }
  return <WhatsappCanalCard canal={canal} />;
}
