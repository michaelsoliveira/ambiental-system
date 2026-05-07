'use client'

import { useParams } from 'next/navigation'

import { Separator } from '@/components/ui/separator'
import { usePatrimonioResumo } from '@/hooks/use-patrimonio'

import { PatrimonioDashboardCards } from './patrimonio-dashboard-cards'
import { PatrimonioTabs } from './patrimonio-tabs'

export function PatrimonioPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: resumo, isLoading } = usePatrimonioResumo(slug!)

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          Carregando posição patrimonial...
        </div>
      ) : (
        <PatrimonioDashboardCards resumo={resumo} />
      )}

      <Separator />
      <PatrimonioTabs />
    </div>
  )
}
