'use client';

import { useOcBasePath } from '../lib/oc-routes';
import { Shield, Eye, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOcWatchdogQuery, useOcWatchdogPatch } from '../hooks/use-oc-api';
import Link from 'next/link';

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
        <Icon className={cn('h-4 w-4', color ?? 'text-muted-foreground')} />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function OcWatchdogDashboard() {
  const { slug } = useOcBasePath();

  const { data, isLoading } = useOcWatchdogQuery();

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Carregando Watchdog...</div>;

  const { config, conversas_presas, timers_ativos, checks_24h, reativacoes_24h } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Watchdog</h2>
          <p className="text-sm text-muted-foreground">Monitor de conversas presas — refresh a cada 15s</p>
        </div>
        <Badge variant={config.habilitado ? 'default' : 'secondary'} className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {config.habilitado ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Zap}          label="Timers Ativos"      value={timers_ativos}   sub="Jobs aguardando" />
        <MetricCard icon={Eye}          label="Checks Últimas 24h" value={checks_24h}       sub="Conversas avaliadas" />
        <MetricCard icon={Zap}          label="Reativações 24h"    value={reativacoes_24h}  sub="IA reassumiu" color="text-blue-500" />
        <MetricCard icon={AlertTriangle} label="Conversas Presas"  value={conversas_presas} sub="isStuck=true" color={conversas_presas > 0 ? 'text-destructive' : undefined} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Thresholds Atuais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            {[
              { label: 'STATUS=BOT',     value: `${config.threshold_bot_min}min` },
              { label: 'STATUS=PENDING', value: `${config.threshold_pending_min}min` },
              { label: 'STATUS=OPEN',    value: `${config.threshold_open_min}min` },
              { label: 'MAX TENTATIVAS', value: config.max_tentativas },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-medium mb-2">
          Em alerta{' '}
          {conversas_presas > 0 && (
            <span className="text-muted-foreground">({conversas_presas})</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Conversas com tentativas de reativação — veja em{' '}
          <Link href={`/org/${slug}/omnichannel/inbox?status=bot`} className="text-primary underline">
            Inbox
          </Link>
        </p>
      </div>
    </div>
  );
}
