'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { PatrimonioPassivo } from '@/http/patrimonio'
import {
  useCreatePatrimonioPassivo,
  useDeletePatrimonioPassivo,
  usePatrimonioPassivos,
  useUpdatePatrimonioPassivo,
} from '@/hooks/use-patrimonio'
import { formatCurrency, formatDateShort } from '@/lib/format'

import {
  getOptionLabel,
  statusPassivoOptions,
  tipoPassivoOptions,
} from './patrimonio-options'
import { PassivosForm } from './passivos-form'

export function PassivosListing() {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPassivo, setEditingPassivo] = useState<PatrimonioPassivo | null>(null)

  const { data, isLoading } = usePatrimonioPassivos(slug!, {
    search: search || undefined,
    status: status || undefined,
    limit: 50,
  })
  const createPassivo = useCreatePatrimonioPassivo(slug!)
  const updatePassivo = useUpdatePatrimonioPassivo(slug!)
  const deletePassivo = useDeletePatrimonioPassivo(slug!)

  function openCreateDialog() {
    setEditingPassivo(null)
    setIsDialogOpen(true)
  }

  function openEditDialog(passivo: PatrimonioPassivo) {
    setEditingPassivo(passivo)
    setIsDialogOpen(true)
  }

  function handleSubmit(formData: Record<string, any>) {
    if (editingPassivo) {
      updatePassivo.mutate(
        { id: editingPassivo.id, data: formData },
        { onSuccess: () => setIsDialogOpen(false) },
      )
      return
    }

    createPassivo.mutate(formData, { onSuccess: () => setIsDialogOpen(false) })
  }

  const passivos = data?.passivos ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="Buscar por descrição ou credor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="md:w-80"
          />
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            {statusPassivoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Passivo
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Credor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Saldo devedor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando passivos...
                </td>
              </tr>
            )}
            {!isLoading && passivos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum passivo manual cadastrado.
                </td>
              </tr>
            )}
            {passivos.map((passivo) => (
              <tr key={passivo.id} className="border-t">
                <td className="px-4 py-3 font-medium">{passivo.descricao}</td>
                <td className="px-4 py-3">{getOptionLabel(tipoPassivoOptions, passivo.tipo)}</td>
                <td className="px-4 py-3">{passivo.credor || '-'}</td>
                <td className="px-4 py-3">
                  {passivo.data_vencimento ? formatDateShort(passivo.data_vencimento) : '-'}
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(passivo.saldo_devedor)}</td>
                <td className="px-4 py-3">{getOptionLabel(statusPassivoOptions, passivo.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(passivo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deletePassivo.mutate(passivo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPassivo ? 'Editar passivo' : 'Novo passivo manual'}</DialogTitle>
          </DialogHeader>
          <PassivosForm
            key={editingPassivo?.id ?? 'create'}
            initialData={editingPassivo}
            isPending={createPassivo.isPending || updatePassivo.isPending}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
