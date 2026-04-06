'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { CentroCustoForm } from '@/features/centro-custo/centro-custo-form'
import CentroCustoListingPage from '@/features/centro-custo/centro-custo-listing'

export default function CentrosCustoPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <Heading
          title="Centros de Custo"
          description="Gerencie os centros de custo para classificação financeira"
        />
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Centro de Custo
        </Button>
      </div>

      <Separator />

      <CentroCustoListingPage />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Centro de Custo</DialogTitle>
          </DialogHeader>
          <CentroCustoForm onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
