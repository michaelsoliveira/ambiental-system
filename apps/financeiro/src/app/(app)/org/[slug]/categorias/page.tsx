'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Heading } from '@/components/ui/heading'
import { Separator } from '@/components/ui/separator'
import { CategoriaForm } from '@/features/categoria/categoria-form'
import CategoriaListingPage from '@/features/categoria/categoria-listing'

export default function CategoriasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <Heading
          title="Categorias Financeiras"
          description="Gerencie as categorias de receitas e despesas"
        />
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Separator />

      <CategoriaListingPage />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p>
              Crie uma nova categoria para organizar suas receitas e despesas.
            </p>
          </DialogDescription>
          <CategoriaForm onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
