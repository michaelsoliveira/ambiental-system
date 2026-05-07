'use client'

import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { AtivosListing } from './ativos-listing'
import { PassivosListing } from './passivos-listing'

const tabs = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'ativos', label: 'Ativos' },
  { id: 'passivos', label: 'Passivos' },
] as const

export function PatrimonioTabs() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('resumo')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <Card>
          <CardHeader>
            <CardTitle>Como interpretar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              O resumo patrimonial compara o valor atual dos ativos cadastrados com dívidas em aberto.
            </p>
            <p>
              As dívidas automáticas vêm de lançamentos e parcelas de despesa ainda não pagos. Os passivos manuais
              cobrem empréstimos, financiamentos e obrigações que ainda não estão no financeiro.
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'ativos' && <AtivosListing />}
      {activeTab === 'passivos' && <PassivosListing />}
    </div>
  )
}
