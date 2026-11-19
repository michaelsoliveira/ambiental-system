'use client'

import { type ComponentType, type ReactNode, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowDownRight, ArrowUpRight, BarChart3, Landmark, ReceiptText, Settings2, TrendingUp, UsersRound, WalletCards } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  Cell,
  CartesianGrid,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboardResumo, useDashboardSeries } from '@/hooks/use-dashboard-financeiro'
import { useFolhasPagamento } from '@/hooks/use-folha-pagamento'

function Money({ value }: { value: number }) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const brlMil = (v: number) => `R$ ${Math.round(v / 1000)} mil`

const CHART_SERIES = [
  { nome: 'Receita', cor: '#22c55e' },
  { nome: 'Despesa', cor: '#ef4444' },
  { nome: 'Saldo', cor: '#3b82f6' },
]

const CATEGORY_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
  detail,
}: {
  title: string
  value: ReactNode
  icon: ComponentType<{ className?: string }>
  tone: 'emerald' | 'red' | 'blue' | 'violet' | 'amber'
  detail: string
}) {
  const tones = {
    emerald: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-500/12 text-red-600 dark:text-red-400',
    blue: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
    amber: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  }

  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardContent className="flex items-start gap-3 p-4">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-0.5 truncate text-lg font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatMesEixo(mes: string) {
  const m = /^(\d{4})-(\d{1,2})/.exec(String(mes))
  return m ? `${m[2].padStart(2, '0')}/${m[1]}` : String(mes)
}

function EvolucaoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const valores = [row.receitas, row.despesas, row.saldo]
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-xl dark:border-white/10 dark:bg-[#1a1f2b] dark:text-white">
      <div className="mb-2 text-sm font-semibold">{formatMesEixo(label)}</div>
      {CHART_SERIES.map((s, i) => (
        <div key={s.nome} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: s.cor }} />
            {s.nome}:
          </span>
          <span className="font-semibold">{Money({ value: Number(valores[i] ?? 0) })}</span>
        </div>
      ))}
    </div>
  )
}

const FOLHA_STATUS_LABEL: Record<string, string> = {
  TODAS: 'Todas (qualquer status)',
  PAGA: 'Somente folhas pagas',
  FECHADA: 'Somente folhas fechadas',
  ABERTA: 'Somente folhas abertas',
  CANCELADA: 'Somente folhas canceladas',
}

const STATUS_LANCAMENTO_LABEL: Record<string, string> = {
  PAGO: 'Pago',
  NAO_PAGO: 'Não pago',
  TODOS: 'Todos (exceto cancelados)',
}

function statusLancamentoFrase(status: string) {
  if (status === 'PAGO') return 'pagos'
  if (status === 'NAO_PAGO') return 'não pagos'
  return 'não cancelados'
}

export function DashboardFinanceiroPage() {
  const { slug } = useParams<{ slug: string }>()
  const [competenciaSelect, setCompetenciaSelect] = useState<string | undefined>(undefined)
  const [competenciaCustom, setCompetenciaCustom] = useState('')
  const [folhaStatusFiltro, setFolhaStatusFiltro] = useState('TODAS')
  const [statusLancamentoFiltro, setStatusLancamentoFiltro] = useState('PAGO')

  const competenciaApi = useMemo(() => {
    const c = competenciaCustom.trim()
    if (/^\d{1,2}\/\d{4}$/.test(c)) return c
    return competenciaSelect
  }, [competenciaCustom, competenciaSelect])

  const relatorioParams = useMemo(
    () => ({
      competencia: competenciaApi,
      folha_status: folhaStatusFiltro,
      status_lancamento: statusLancamentoFiltro,
    }),
    [competenciaApi, folhaStatusFiltro, statusLancamentoFiltro],
  )

  const { data: resumo } = useDashboardResumo(slug, relatorioParams)
  const { data: seriesData } = useDashboardSeries(slug, { months: 12, ...relatorioParams })

  const { data: folhasData } = useFolhasPagamento(slug, { limit: 120 })
  const opcoesCompetencia = useMemo(() => {
    const folhas = folhasData?.folhas ?? []
    const seen = new Set<string>()
    const out: { value: string; label: string }[] = []
    for (const f of folhas) {
      if (f?.competencia && !seen.has(f.competencia)) {
        seen.add(f.competencia)
        out.push({ value: f.competencia, label: `${f.competencia} · ${f.status}` })
      }
    }
    return out.sort((a, b) => b.value.localeCompare(a.value))
  }, [folhasData])

  const kpis = resumo?.kpis ?? {
    receita_mes: 0,
    despesa_mes: 0,
    saldo_mes: 0,
    folha_liquida_mes: 0,
    total_parceiros: 0,
    total_funcionarios_ativos: 0,
  }

  const filtrosAplicados = resumo?.filtros as
    | { competencia_aplicada?: string; folha_status?: string; status_lancamento?: string }
    | undefined
  const statusLancamentoAplicado = filtrosAplicados?.status_lancamento ?? statusLancamentoFiltro
  const statusLancamentoLabel =
    STATUS_LANCAMENTO_LABEL[statusLancamentoAplicado] ?? statusLancamentoAplicado
  const statusLancamentoTexto = statusLancamentoFrase(statusLancamentoAplicado)

  const serie = seriesData?.serie_mensal ?? []
  const categorias = seriesData?.categorias ?? []
  const folhaMes = seriesData?.folha_mes as
    | { total_liquido?: number; status?: string | null; competencia?: string }
    | undefined

  const maxCategoria = Math.max(1, ...categorias.map((c: any) => c.total))
  const totalCategorias = categorias.reduce((total: number, categoria: any) => total + Number(categoria.total ?? 0), 0)
  const custoPorNome = (termo: string) =>
    categorias
      .filter((categoria: any) => {
        const nome = String(categoria.categoria_nome ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        return categoria.tipo === 'DESPESA' && nome.includes(termo)
      })
      .reduce((total: number, categoria: any) => total + Number(categoria.total ?? 0), 0)
  const custoFixo = custoPorNome('fix')
  const custoOperacional = custoPorNome('operacional')
  const serieGrafico = serie.map((item: any) => ({
    ...item,
    receitas: Number(item.receitas ?? 0),
    despesas: Number(item.despesas ?? 0),
    saldo: Number(item.saldo ?? 0),
  }))

  return (
    <div className="flex flex-1 flex-col space-y-4 bg-background p-4 md:p-6">
      <Heading
        title="Visão Geral"
        description="Visão consolidada de receitas, despesas, parceiros, funcionários e folha de pagamento."
      />
      <Separator />

      <Card className="border-border/80 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros do relatório</CardTitle>
          <CardDescription>
            Competência afeta receitas/despesas do período, Top categorias e o KPI &quot;Folha líquida&quot;.
            O filtro de status separa lançamentos <strong>pagos</strong> dos <strong>não pagos</strong>{' '}
            (pendente, confirmado ou atrasado). Use o filtro da folha para o líquido da folha.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Competência</Label>
            <Select
              value={competenciaSelect ?? '__atual__'}
              onValueChange={(v) => {
                setCompetenciaSelect(v === '__atual__' ? undefined : v)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mês de referência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__atual__">Mês atual (calendário)</SelectItem>
                {opcoesCompetencia.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Outra competência (MM/AAAA)</Label>
              <Input
                placeholder="ex.: 03/2025"
                value={competenciaCustom}
                onChange={(e) => setCompetenciaCustom(e.target.value)}
              />
              {competenciaCustom.trim() && /^\d{1,2}\/\d{4}$/.test(competenciaCustom.trim()) ? (
                <p className="text-xs text-muted-foreground">Prioridade sobre a seleção acima.</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status do lançamento</Label>
            <Select value={statusLancamentoFiltro} onValueChange={setStatusLancamentoFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LANCAMENTO_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status da folha no relatório</Label>
            <Select value={folhaStatusFiltro} onValueChange={setFolhaStatusFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FOLHA_STATUS_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground md:flex md:flex-col md:justify-end">
            {filtrosAplicados ? (
              <>
                <p>
                  Período dos lançamentos:{' '}
                  <span className="font-medium text-foreground">{filtrosAplicados.competencia_aplicada}</span>
                </p>
                <p>
                  Status dos lançamentos:{' '}
                  <span className="font-medium text-foreground">{statusLancamentoLabel}</span>
                </p>
                <p>
                  Filtro de folha:{' '}
                  <span className="font-medium text-foreground">
                    {FOLHA_STATUS_LABEL[filtrosAplicados.folha_status ?? 'TODAS'] ??
                      filtrosAplicados.folha_status}
                  </span>
                </p>
                {folhaMes?.status != null ? (
                  <p>
                    Folha encontrada: <span className="font-medium text-foreground">{folhaMes.status}</span>
                    {folhaMes.competencia ? (
                      <>
                        {' '}
                        · {folhaMes.competencia}
                      </>
                    ) : null}
                  </p>
                ) : folhaStatusFiltro !== 'TODAS' ? (
                  <p className="text-amber-700 dark:text-amber-500">
                    Nenhuma folha com esse status nesta competência — líquido zerado no KPI.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <MetricCard title="Receita total" value={Money({ value: kpis.receita_mes })} icon={TrendingUp} tone="emerald" detail="Lançamentos do período" />
        <MetricCard title="Despesa total" value={Money({ value: kpis.despesa_mes })} icon={ArrowDownRight} tone="red" detail="Lançamentos do período" />
        <MetricCard title="Saldo do mês" value={Money({ value: kpis.saldo_mes })} icon={kpis.saldo_mes >= 0 ? ArrowUpRight : ArrowDownRight} tone={kpis.saldo_mes >= 0 ? 'emerald' : 'red'} detail={kpis.saldo_mes >= 0 ? 'Resultado positivo' : 'Resultado negativo'} />
        <MetricCard title="Folha líquida" value={Money({ value: kpis.folha_liquida_mes })} icon={ReceiptText} tone="violet" detail="Conforme status selecionado" />
        <MetricCard title="Parceiros" value={kpis.total_parceiros} icon={WalletCards} tone="amber" detail="Total cadastrado" />
        <MetricCard title="Funcionários ativos" value={kpis.total_funcionarios_ativos} icon={UsersRound} tone="blue" detail="Equipe ativa" />
        <MetricCard title="Custo fixo" value={Money({ value: custoFixo })} icon={Landmark} tone="violet" detail="Categorias de despesa fixa" />
        <MetricCard title="Custo operacional" value={Money({ value: custoOperacional })} icon={Settings2} tone="amber" detail="Categorias operacionais" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] [&>div]:border-border/80 [&>div]:bg-card [&>div]:shadow-sm">
        <Card className="text-card-foreground dark:border-white/10! dark:bg-[#0f1420]! dark:text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Evolução mensal (Receita x Despesa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground dark:text-slate-300">
              {CHART_SERIES.map((s) => (
                <span key={s.nome} className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.cor }} />
                  {s.nome}
                </span>
              ))}
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serieGrafico} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gDespesa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="color-mix(in oklab, var(--foreground) 12%, transparent)" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tickFormatter={formatMesEixo}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={brlMil}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    content={<EvolucaoTooltip />}
                    cursor={{ stroke: 'color-mix(in oklab, var(--foreground) 30%, transparent)', strokeDasharray: '3 3' }}
                  />
                  <Bar dataKey="saldo" fill="url(#gSaldo)" radius={[4, 4, 0, 0]} barSize={32} />
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#gReceita)"
                    dot={{ r: 4, fill: 'var(--card)', stroke: '#22c55e', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: 'var(--card)', stroke: '#22c55e', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#gDespesa)"
                    dot={{ r: 4, fill: 'var(--card)', stroke: '#ef4444', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: 'var(--card)', stroke: '#ef4444', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categorias</CardTitle>
            <CardDescription className="text-xs">
              Lançamentos {statusLancamentoTexto} na competência{' '}
              <span className="font-medium text-foreground">
                {filtrosAplicados?.competencia_aplicada ??
                  seriesData?.filtros?.competencia_aplicada ??
                  'mês atual'}
              </span>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento {statusLancamentoTexto} nesta competência.
              </p>
            ) : (
              categorias.map((item: any) => (
              <div key={item.categoria_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.categoria_nome}</span>
                  <span>{Money({ value: item.total })}</span>
                </div>
                <div className="h-2 rounded bg-slate-200">
                  <div
                    className="h-2 rounded bg-slate-700"
                    style={{ width: `${(item.total / maxCategoria) * 100}%` }}
                  />
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-emerald-500" />
              Fluxo de caixa
            </CardTitle>
            <CardDescription className="text-xs">Saldo mensal acumulado no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieGrafico} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gFluxoCaixa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="color-mix(in oklab, var(--foreground) 12%, transparent)" vertical={false} />
                  <XAxis dataKey="mes" tickFormatter={formatMesEixo} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={brlMil} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
                  <Tooltip content={<EvolucaoTooltip />} cursor={{ stroke: 'color-mix(in oklab, var(--foreground) 30%, transparent)', strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="saldo" stroke="#22c55e" strokeWidth={2.5} fill="url(#gFluxoCaixa)" dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22c55e', stroke: 'var(--card)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-violet-500" />
              Despesas por categoria
            </CardTitle>
            <CardDescription className="text-xs">Distribuição da competência selecionada</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[230px] items-center gap-3">
            {categorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de categoria neste período.</p>
            ) : (
              <>
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categorias} dataKey="total" nameKey="categoria_nome" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} stroke="none">
                        {categorias.map((_: any, index: number) => <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 space-y-2 text-xs">
                  {categorias.slice(0, 5).map((item: any, index: number) => (
                    <div key={item.categoria_id} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5"><i className="size-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /><span className="truncate">{item.categoria_nome}</span></span>
                      <span className="font-medium">{totalCategorias ? `${Math.round((Number(item.total) / totalCategorias) * 100)}%` : '0%'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4 text-sky-500" />Top centros de custo</CardTitle>
            <CardDescription className="text-xs">Categorias com maior movimentação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorias.slice(0, 5).map((item: any, index: number) => (
              <div key={item.categoria_id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate">{item.categoria_nome}</span><span className="shrink-0 font-medium">{Money({ value: Number(item.total) })}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(Number(item.total) / maxCategoria) * 100}%`, background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos lançamentos</CardTitle>
          <CardDescription className="text-xs">
            Os 8 lançamentos {statusLancamentoTexto} mais recentes da organização
            (independente do filtro de competência acima).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(resumo?.latest_lancamentos ?? []).map((l: any) => (
            <div key={l.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                <div>{l.descricao}</div>
                <div className="text-muted-foreground">{l.categoria?.nome ?? '-'}</div>
              </div>
              <div className={l.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-red-600'}>
                {Money({ value: Number(l.valor) })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
