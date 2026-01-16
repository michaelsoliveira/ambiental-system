'use client'

import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { LancamentoRelatorioExtrato } from '@/features/lancamento/relatorio-extrato/lancamento-relatorio-extrato'

export default function RelatorioExtratoPage() {
  return (
    <div className="space-y-6 p-6 print:p-0">
      <div className="flex items-start justify-between print:hidden">
        <Heading
          title="Relatório de Extrato"
          description="Gere relatórios de lançamentos financeiros com filtros avançados"
        />
      </div>

      <Separator className="print:hidden" />

      <LancamentoRelatorioExtrato />
    </div>
  )
}
