'use client'

import { Building2, Scale, TrendingDown, Wallet } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

import type { PatrimonioResumo } from '@/http/patrimonio'

export function PatrimonioDashboardCards({ resumo }: { resumo?: PatrimonioResumo }) {
  const relacao = resumo?.relacaoDividaPatrimonio

  const cards = [
    {
      title: 'Total em patrimônio',
      value: formatCurrency(resumo?.totalAtivos ?? 0),
      description: 'Valor atual estimado dos ativos',
      icon: Building2,
    },
    {
      title: 'Dívidas automáticas',
      value: formatCurrency(resumo?.dividasAutomaticas ?? 0),
      description: 'Lançamentos e parcelas em aberto',
      icon: TrendingDown,
    },
    {
      title: 'Passivos manuais',
      value: formatCurrency(resumo?.totalPassivosManuais ?? 0),
      description: 'Empréstimos e obrigações cadastradas',
      icon: Wallet,
    },
    {
      title: 'Patrimônio líquido',
      value: formatCurrency(resumo?.patrimonioLiquido ?? 0),
      description: relacao === null || relacao === undefined
        ? 'Sem patrimônio cadastrado'
        : `Dívidas equivalem a ${(relacao * 100).toFixed(1)}% do patrimônio`,
      icon: Scale,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
