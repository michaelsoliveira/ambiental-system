'use client'

import { useParams } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { useDashboardResumo, useDashboardSeries } from '@/hooks/use-dashboard-financeiro'

function Money({ value }: { value: number }) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DashboardFinanceiroPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: resumo } = useDashboardResumo(slug)
  const { data: seriesData } = useDashboardSeries(slug, 12)

  const kpis = resumo?.kpis ?? {
    receita_mes: 0,
    despesa_mes: 0,
    saldo_mes: 0,
    folha_liquida_mes: 0,
    total_parceiros: 0,
    total_funcionarios_ativos: 0,
  }

  const serie = seriesData?.serie_mensal ?? []
  const categorias = seriesData?.categorias ?? []
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Receita do mês</CardTitle></CardHeader><CardContent>{Money({ value: kpis.receita_mes })}</CardContent></Card>
        <Card><CardHeader><CardTitle>Despesa do mês</CardTitle></CardHeader><CardContent>{Money({ value: kpis.despesa_mes })}</CardContent></Card>
        <Card><CardHeader><CardTitle>Saldo do mês</CardTitle></CardHeader><CardContent>{Money({ value: kpis.saldo_mes })}</CardContent></Card>
        <Card><CardHeader><CardTitle>Folha líquida</CardTitle></CardHeader><CardContent>{Money({ value: kpis.folha_liquida_mes })}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total de parceiros</CardTitle></CardHeader><CardContent>{kpis.total_parceiros}</CardContent></Card>
        <Card><CardHeader><CardTitle>Funcionários ativos</CardTitle></CardHeader><CardContent>{kpis.total_funcionarios_ativos}</CardContent></Card>
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

                  {/* eixo central em 50%: esquerda = negativo, direita = positivo */}
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
          <CardHeader><CardTitle>Top categorias</CardTitle></CardHeader>
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
