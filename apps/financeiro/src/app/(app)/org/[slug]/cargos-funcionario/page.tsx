'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { CargoFuncionarioForm } from '@/features/cargo-funcionario/cargo-funcionario-form'
import CargoFuncionarioListingPage from '@/features/cargo-funcionario/cargo-funcionario-listing'

export default function CargosFuncionarioPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <Heading
          title="Cargos"
          description="Gerencie os cargos e salários base dos funcionários"
        />
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      <Separator />

      <CargoFuncionarioListingPage />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cargo</DialogTitle>
          </DialogHeader>
          <CargoFuncionarioForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
