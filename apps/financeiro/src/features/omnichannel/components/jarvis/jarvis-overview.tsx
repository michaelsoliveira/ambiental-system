'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity,
  ArrowLeftRight,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Cpu,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOcJarvisOverviewQuery } from '@/features/omnichannel/hooks/use-oc-api';
import { cn } from '@/lib/utils';

type Periodo = '24h' | '7d' | '30d';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

function MetricCard({
  title,
  value,
  footer,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  footer: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconClass)} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{footer}</p>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-destructive" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

export function JarvisOverview() {
  const [periodo, setPeriodo] = useState<Periodo>('7d');
  const { data, isLoading } = useOcJarvisOverviewQuery(periodo);

  const fmtUsd = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  const fmtLat = (ms: number | null | undefined) =>
    ms != null ? `${ms}ms` : '—';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Visão geral</h1>
          <p className="text-sm text-muted-foreground">
            Custo, tokens, runs e qualidade — atualiza a cada 5s
          </p>
        </div>
        <div className="flex rounded-lg border p-0.5">
          {PERIODOS.map((p) => (
            <Button
              key={p.value}
              type="button"
              size="sm"
              variant={periodo === p.value ? 'default' : 'ghost'}
              className="h-8 px-3 text-xs"
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <p className="text-sm text-muted-foreground">Carregando métricas…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Custo (USD)"
              value={fmtUsd(data?.custo_usd ?? 0)}
              footer={`${fmtUsd(data?.custo_por_run_usd ?? 0)} por execução em média`}
              icon={CircleDollarSign}
              iconClass="text-emerald-600"
            />
            <MetricCard
              title="Tokens"
              value={(data?.tokens_total ?? 0).toLocaleString('pt-BR')}
              footer={`${data?.cache_hits ?? 0} cache hits`}
              icon={Cpu}
              iconClass="text-blue-600"
            />
            <MetricCard
              title="Runs"
              value={String(data?.runs_total ?? 0)}
              footer={`${data?.runs_ok ?? 0} OK · ${data?.runs_falhas ?? 0} falhas`}
              icon={Activity}
              iconClass="text-violet-600"
            />
            <MetricCard
              title="Taxa de sucesso"
              value={
                data?.taxa_sucesso_pct != null ? `${data.taxa_sucesso_pct}%` : '—'
              }
              footer={`latência p50 ${fmtLat(data?.latencia_p50_ms)} · p95 ${fmtLat(data?.latencia_p95_ms)}`}
              icon={CheckCircle2}
              iconClass="text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Custo por modelo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.por_modelo.length ?? 0) === 0 ? (
                  <EmptyPanel>Sem execuções no período.</EmptyPanel>
                ) : (
                  <ul className="space-y-2">
                    {data?.por_modelo.map((m) => (
                      <li key={m.modelo} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{m.modelo}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {fmtUsd(m.custo_usd)} · {m.runs} runs
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Por agente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.por_agente.length ?? 0) === 0 ? (
                  <EmptyPanel>Sem execuções no período.</EmptyPanel>
                ) : (
                  <ul className="space-y-2">
                    {data?.por_agente.map((a) => (
                      <li key={a.agente_id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{a.nome}</span>
                        <span className="shrink-0 text-muted-foreground">{a.runs} runs</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tools chamadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.tools_chamadas.length ?? 0) === 0 ? (
                  <EmptyPanel>Sem chamadas no período.</EmptyPanel>
                ) : (
                  <ul className="space-y-2">
                    {data?.tools_chamadas.map((t) => (
                      <li key={t.skill_id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{t.nome}</span>
                        <span className="shrink-0 text-muted-foreground">{t.chamadas}×</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Como as runs terminaram
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data?.por_status ?? {}).length === 0 ? (
                  <EmptyPanel>Sem dados.</EmptyPanel>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data?.por_status ?? {}).map(([status, count]) => (
                      <Badge key={status} variant="secondary" className="text-xs">
                        {status}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Delegações entre agentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.delegacoes.length ?? 0) === 0 ? (
                  <EmptyPanel>Sem delegações.</EmptyPanel>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data?.delegacoes.map((d, i) => (
                      <li key={i} className="text-muted-foreground">
                        {d.de_agente_id?.slice(0, 8)} → {d.para_agente_id?.slice(0, 8)}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Últimas execuções
              </CardTitle>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ao vivo
              </span>
            </CardHeader>
            <CardContent>
              {(data?.ultimas_execucoes.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  Ainda não rolou execução.
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.ultimas_execucoes.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <StatusIcon status={run.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {run.status}
                          </Badge>
                          {run.agente_nome && (
                            <span className="font-medium">{run.agente_nome}</span>
                          )}
                          {run.modelo && (
                            <span className="text-xs text-muted-foreground">{run.modelo}</span>
                          )}
                        </div>
                        {run.error_msg && (
                          <p className="mt-1 truncate text-xs text-destructive">{run.error_msg}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        {run.duration_ms != null && <p>{run.duration_ms}ms</p>}
                        <p>
                          {format(new Date(run.started_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
