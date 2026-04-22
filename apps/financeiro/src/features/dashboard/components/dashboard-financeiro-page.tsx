'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

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

const FOLHA_STATUS_LABEL: Record<string, string> = {
  TODAS: 'Todas (qualquer status)',
  PAGA: 'Somente folhas pagas',
  FECHADA: 'Somente folhas fechadas',
  ABERTA: 'Somente folhas abertas',
  CANCELADA: 'Somente folhas canceladas',
}

export function DashboardFinanceiroPage() {
  const { slug } = useParams<{ slug: string }>()
  const [competenciaSelect, setCompetenciaSelect] = useState<string | undefined>(undefined)
  const [competenciaCustom, setCompetenciaCustom] = useState('')
  const [folhaStatusFiltro, setFolhaStatusFiltro] = useState('TODAS')

  const competenciaApi = useMemo(() => {
    const c = competenciaCustom.trim()
    if (/^\d{1,2}\/\d{4}$/.test(c)) return c
    return competenciaSelect
  }, [competenciaCustom, competenciaSelect])

  const relatorioParams = useMemo(
    () => ({
      competencia: competenciaApi,
      folha_status: folhaStatusFiltro,
    }),
    [competenciaApi, folhaStatusFiltro],
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
    | { competencia_aplicada?: string; folha_status?: string }
    | undefined

  const serie = seriesData?.serie_mensal ?? []
  const categorias = seriesData?.categorias ?? []
  const folhaMes = seriesData?.folha_mes as
    | { total_liquido?: number; status?: string | null; competencia?: string }
    | undefined

  const maxCategoria = Math.max(1, ...categorias.map((c: any) => c.total))
  const serieComSinal = serie.map((item: any) => ({
    ...item,
    receitaPositiva: Number(item.receitas ?? 0),
    despesaNegativa: Number(item.despesas ?? 0) * -1,
    saldo: Number(item.saldo ?? 0),
  }))
  const maxAbs = Math.max(
    1,
    ...serieComSinal.map((item: any) =>
      Math.max(Math.abs(item.receitaPositiva), Math.abs(item.despesaNegativa), Math.abs(item.saldo)),
    ),
  )

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <Heading
        title="Visão Geral"
        description="Visão consolidada de receitas, despesas, parceiros, funcionários e folha de pagamento."
      />
      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros do relatório</CardTitle>
          <CardDescription>
            Competência e status da folha afetam receitas/despesas do período, o KPI &quot;Folha líquida&quot; e o
            resumo da folha abaixo. Use &quot;Somente folhas pagas&quot; para considerar apenas competências com folha
            marcada como paga.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Receita do mês</CardTitle>
          </CardHeader>
          <CardContent>{Money({ value: kpis.receita_mes })}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Despesa do mês</CardTitle>
          </CardHeader>
          <CardContent>{Money({ value: kpis.despesa_mes })}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo do mês</CardTitle>
          </CardHeader>
          <CardContent>{Money({ value: kpis.saldo_mes })}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Folha líquida</CardTitle>
            <CardDescription className="text-xs">
              Valor da folha no período, respeitando o filtro de status (ex.: apenas pagas).
            </CardDescription>
          </CardHeader>
          <CardContent>{Money({ value: kpis.folha_liquida_mes })}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de parceiros</CardTitle>
          </CardHeader>
          <CardContent>{kpis.total_parceiros}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Funcionários ativos</CardTitle>
          </CardHeader>
          <CardContent>{kpis.total_funcionarios_ativos}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução mensal (Receita x Despesa)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                <span className="h-2 w-2 rounded bg-emerald-500" />
                Receita (positiva)
              </div>
              <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                <span className="h-2 w-2 rounded bg-red-500" />
                Despesa (negativa)
              </div>
              <div className="inline-flex items-center gap-1 rounded border px-2 py-1">
                <span className="h-2 w-2 rounded bg-blue-500" />
                Saldo
              </div>
            </div>

            {serieComSinal.map((item: any) => {
              const receitaWidth = (Math.abs(item.receitaPositiva) / maxAbs) * 50
              const despesaWidth = (Math.abs(item.despesaNegativa) / maxAbs) * 50
              const saldoWidth = (Math.abs(item.saldo) / maxAbs) * 50

              return (
                <div key={item.mes} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.mes}</span>
                    <span className={item.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {Money({ value: item.saldo })}
                    </span>
                  </div>

                  <div className="relative h-8 rounded bg-muted/40">
                    <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-muted-foreground/40" />

                    <div
                      className="absolute bottom-1 top-1 rounded-r bg-emerald-500/80"
                      style={{ left: '50%', width: `${receitaWidth}%` }}
                      title={`Receita: ${Money({ value: item.receitaPositiva })}`}
                    />

                    <div
                      className="absolute bottom-1 top-1 rounded-l bg-red-500/80"
                      style={{ right: '50%', width: `${despesaWidth}%` }}
                      title={`Despesa: ${Money({ value: Math.abs(item.despesaNegativa) })}`}
                    />

                    <div
                      className={`absolute top-0 h-1 rounded ${item.saldo >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                      style={{
                        left: item.saldo >= 0 ? '50%' : undefined,
                        right: item.saldo < 0 ? '50%' : undefined,
                        width: `${saldoWidth}%`,
                      }}
                      title={`Saldo: ${Money({ value: item.saldo })}`}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categorias.map((item: any) => (
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
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos lançamentos</CardTitle>
          <CardDescription className="text-xs">
            Os 8 lançamentos mais recentes da organização (independente do filtro de competência acima).
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
