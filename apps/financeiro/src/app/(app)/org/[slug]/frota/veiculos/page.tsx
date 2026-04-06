'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VeiculosListing } from '@/features/frota/veiculos-listing'
import { VeiculoForm } from '@/features/frota/veiculo-form'

export default function FrotaVeiculosPage() {
  const { slug } = useParams<{ slug: string }>()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Heading
          title="Veículos"
          description="Cadastro operacional. Valores financeiros são criados ao registrar abastecimento, manutenção ou viagem com receita."
        />
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo veículo
        </Button>
      </div>

      <Separator />

      <VeiculosListing />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo veículo</DialogTitle>
          </DialogHeader>
          <VeiculoForm
            org={slug!}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
