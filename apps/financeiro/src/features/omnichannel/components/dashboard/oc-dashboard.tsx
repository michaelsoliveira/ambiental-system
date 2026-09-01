'use client';

import { useOcBasePath } from '../../lib/oc-routes';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquare,
  RotateCcw,
  Shield,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOcDashboardQuery } from '@/features/omnichannel/hooks/use-oc-api';
import { cn } from '@/lib/utils';

type Periodo = '7d' | '30d' | '90d';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

const STATUS_LABELS: Record<string, string> = {
  bot: 'IA',
  pending: 'Aguardando',
  open: 'Abertas',
  closed: 'Encerradas',
  snoozed: 'Adiadas',
};

const STATUS_COLORS: Record<string, string> = {
  bot: '#3b82f6',
  pending: '#f59e0b',
  open: '#22c55e',
  closed: '#94a3b8',
  snoozed: '#a855f7',
};

const HEATMAP_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

export function OcDashboard() {
  const { slug } = useOcBasePath();

  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const { data, isLoading } = useOcDashboardQuery(periodo);

  const chartSerie = useMemo(
    () =>
      (data?.serie_diaria ?? []).map((d: any) => ({
        ...d,
        label: format(parseISO(d.data), 'dd/MM', { locale: ptBR }),
      })),
    [data?.serie_diaria],
  );

  const statusChart = useMemo(
    () =>
      Object.entries(data?.por_status ?? {}).map(([status, total]) => ({
        name: STATUS_LABELS[status] ?? status,
        value: total,
        key: status,
      })),
    [data?.por_status],
  );

  const heatmapMax = useMemo(() => {
    const flat = (data?.heatmap ?? []).flat();
    return flat.length ? Math.max(...flat) : 1;
  }, [data?.heatmap]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Métricas operacionais de atendimento e canais
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
              title="Conversas ativas"
              value={String(data?.conversas_ativas ?? 0)}
              footer={`${data?.total_conversas ?? 0} no período`}
              icon={MessageSquare}
              iconClass="text-blue-600"
            />
            <MetricCard
              title="Tempo 1ª resposta"
              value={`${(data?.tempo_primeira_resposta_avg ?? 0).toFixed(0)} min`}
              footer="média do período"
              icon={Clock}
              iconClass="text-amber-600"
            />
            <MetricCard
              title="Taxa de resolução"
              value={`${data?.taxa_resolucao_pct ?? 0}%`}
              footer={`${data?.conversas_fechadas ?? 0} encerradas`}
              icon={CheckCircle2}
              iconClass="text-emerald-600"
            />
            <MetricCard
              title="Conversas presas"
              value={String(data?.conversas_presas ?? 0)}
              footer="watchdog detectou"
              icon={AlertTriangle}
              iconClass={
                (data?.conversas_presas ?? 0) > 0 ? 'text-destructive' : 'text-muted-foreground'
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="FCR"
              value={`${data?.fcr_pct ?? 0}%`}
              footer="sem reabertura"
              icon={CheckCircle2}
              iconClass="text-violet-600"
            />
            <MetricCard
              title="Taxa de reabertura"
              value={`${data?.taxa_reabertura_pct ?? 0}%`}
              footer="conversas reabertas"
              icon={RotateCcw}
              iconClass="text-muted-foreground"
            />
            <MetricCard
              title="CSAT médio"
              value={data?.csat_avg != null ? `${data.csat_avg.toFixed(1)}` : '—'}
              footer="satisfação do cliente"
              icon={Users}
              iconClass="text-sky-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversas no período
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartSerie.length === 0 ? (
                  <EmptyPanel>Sem conversas no período.</EmptyPanel>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartSerie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                        <Tooltip
                          formatter={(value) => [Number(value ?? 0), 'Conversas']}
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload as { data?: string } | undefined;
                            return row?.data
                              ? format(parseISO(row.data), "dd 'de' MMM", { locale: ptBR })
                              : '';
                          }}
                        />
                        <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Por status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusChart.length === 0 ? (
                  <EmptyPanel>Sem dados.</EmptyPanel>
                ) : (
                  <>
                    <div className="mx-auto h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChart}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={48}
                            outerRadius={72}
                            paddingAngle={2}
                          >
                            {statusChart.map((entry) => (
                              <Cell
                                key={entry.key}
                                fill={STATUS_COLORS[entry.key] ?? '#94a3b8'}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {statusChart.map((s: any) => (
                        <li key={s.key} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[s.key] ?? '#94a3b8' }}
                            />
                            {s.name}
                          </span>
                          <span className="text-muted-foreground">{s.value}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Por canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.por_canal.length ?? 0) === 0 ? (
                  <EmptyPanel>Sem conversas por canal.</EmptyPanel>
                ) : (
                  <ul className="space-y-2">
                    {data?.por_canal.map((c: any) => (
                      <li key={c.canal_id} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{c.nome}</span>
                        <span className="shrink-0 text-muted-foreground">{c.total} conversas</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Picos de horário
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.heatmap.length ?? 0) === 0 ? (
                  <EmptyPanel>Sem dados de horário.</EmptyPanel>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[520px]">
                      <div className="mb-1 grid grid-cols-[2rem_repeat(24,1fr)] gap-px text-[9px] text-muted-foreground">
                        <span />
                        {Array.from({ length: 24 }, (_, h) => (
                          <span key={h} className="text-center">
                            {h % 6 === 0 ? `${h}h` : ''}
                          </span>
                        ))}
                      </div>
                      {(data?.heatmap ?? []).map((row: any, dayIdx: number) => (
                        <div
                          key={HEATMAP_DAYS[dayIdx]}
                          className="mb-px grid grid-cols-[2rem_repeat(24,1fr)] gap-px"
                        >
                          <span className="pr-1 text-right text-[10px] text-muted-foreground">
                            {HEATMAP_DAYS[dayIdx]}
                          </span>
                          {row.map((count: number, hour: number) => (
                            <span
                              key={hour}
                              title={`${HEATMAP_DAYS[dayIdx]} ${hour}h — ${count}`}
                              className="aspect-square rounded-sm"
                              style={{
                                backgroundColor:
                                  count === 0
                                    ? 'hsl(var(--muted))'
                                    : `rgba(37, 99, 235, ${0.15 + (count / heatmapMax) * 0.85})`,
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Acesso rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  {
                    href: `/org/${slug}/omnichannel/inbox`,
                    label: 'Inbox',
                    desc: 'Ver conversas',
                    icon: Inbox,
                  },
                  {
                    href: `/org/${slug}/omnichannel/watchdog`,
                    label: 'Watchdog',
                    desc: 'Conversas presas',
                    icon: Shield,
                  },
                  {
                    href: `/org/${slug}/omnichannel/agentes`,
                    label: 'Agentes',
                    desc: 'IA e organograma',
                    icon: Bot,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-accent/50"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span>
                          <span className="block font-medium">{item.label}</span>
                          <span className="text-xs text-muted-foreground">{item.desc}</span>
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
              {(data?.conversas_presas ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                  <Badge variant="destructive" className="text-[10px]">
                    {data?.conversas_presas} presas
                  </Badge>
                  <span className="text-muted-foreground">
                    Há conversas aguardando ação do watchdog.
                  </span>
                  <Link href={`/org/${slug}/omnichannel/watchdog`} className="ml-auto text-primary underline-offset-2 hover:underline">
                    Ver alertas
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
