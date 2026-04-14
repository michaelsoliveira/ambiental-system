'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { EmpresaForm } from '@/features/empresa/empresa-form'
import EmpresaListingPage from '@/features/empresa/empresa-listing'

export default function EmpresasPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <Heading title="Empresas" description="Cadastro e gestão das empresas para vínculo com funcionários" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>
      <Separator />
      <EmpresaListingPage />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova empresa</DialogTitle>
          </DialogHeader>
          <EmpresaForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
