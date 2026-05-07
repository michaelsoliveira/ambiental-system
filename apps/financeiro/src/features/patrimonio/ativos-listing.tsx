'use client'

import { FormEvent, useState } from 'react'
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
import type { PatrimonioAtivo } from '@/http/patrimonio'
import {
  useCreatePatrimonioAtivo,
  useCreatePatrimonioAvaliacao,
  useDeletePatrimonioAtivo,
  usePatrimonioAtivos,
  useUpdatePatrimonioAtivo,
} from '@/hooks/use-patrimonio'
import { formatCurrency, formatDateShort } from '@/lib/format'

import { AtivosForm } from './ativos-form'
import {
  categoriaPatrimonioOptions,
  getOptionLabel,
  statusAtivoOptions,
} from './patrimonio-options'

export function AtivosListing() {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAtivo, setEditingAtivo] = useState<PatrimonioAtivo | null>(null)
  const [avaliandoAtivo, setAvaliandoAtivo] = useState<PatrimonioAtivo | null>(null)

  const { data, isLoading } = usePatrimonioAtivos(slug!, {
    search: search || undefined,
    status: status || undefined,
    limit: 50,
  })
  const createAtivo = useCreatePatrimonioAtivo(slug!)
  const updateAtivo = useUpdatePatrimonioAtivo(slug!)
  const deleteAtivo = useDeletePatrimonioAtivo(slug!)

  function openCreateDialog() {
    setEditingAtivo(null)
    setIsDialogOpen(true)
  }

  function openEditDialog(ativo: PatrimonioAtivo) {
    setEditingAtivo(ativo)
    setIsDialogOpen(true)
  }

  function handleSubmit(formData: Record<string, any>) {
    if (editingAtivo) {
      updateAtivo.mutate(
        { id: editingAtivo.id, data: formData },
        { onSuccess: () => setIsDialogOpen(false) },
      )
      return
    }

    createAtivo.mutate(formData, { onSuccess: () => setIsDialogOpen(false) })
  }

  const ativos = data?.ativos ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="Buscar por nome, código ou localização"
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
            {statusAtivoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ativo
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Ativo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Aquisição</th>
              <th className="px-4 py-3 font-medium">Valor atual</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando ativos...
                </td>
              </tr>
            )}
            {!isLoading && ativos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum ativo patrimonial cadastrado.
                </td>
              </tr>
            )}
            {ativos.map((ativo) => (
              <tr key={ativo.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{ativo.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {[ativo.codigo, ativo.localizacao].filter(Boolean).join(' • ') || ativo.tipo || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getOptionLabel(categoriaPatrimonioOptions, ativo.categoria)}
                </td>
                <td className="px-4 py-3">
                  {ativo.data_aquisicao ? formatDateShort(ativo.data_aquisicao) : '-'}
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(ativo.valor_atual)}</td>
                <td className="px-4 py-3">{getOptionLabel(statusAtivoOptions, ativo.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAvaliandoAtivo(ativo)}>
                      Avaliar
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(ativo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => deleteAtivo.mutate(ativo.id)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingAtivo ? 'Editar ativo' : 'Novo ativo patrimonial'}</DialogTitle>
          </DialogHeader>
          <AtivosForm
            key={editingAtivo?.id ?? 'create'}
            initialData={editingAtivo}
            isPending={createAtivo.isPending || updateAtivo.isPending}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <AvaliacaoDialog ativo={avaliandoAtivo} onOpenChange={(open) => !open && setAvaliandoAtivo(null)} />
    </div>
  )
}

function AvaliacaoDialog({
  ativo,
  onOpenChange,
}: {
  ativo: PatrimonioAtivo | null
  onOpenChange: (open: boolean) => void
}) {
  const { slug } = useParams<{ slug: string }>()
  const createAvaliacao = useCreatePatrimonioAvaliacao(slug!)
  const [valor, setValor] = useState('')
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split('T')[0])
  const [avaliador, setAvaliador] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ativo) return

    createAvaliacao.mutate(
      {
        ativoId: ativo.id,
        data: {
          valor: Number(valor || 0),
          data_avaliacao: dataAvaliacao,
          avaliador: avaliador || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={!!ativo} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar avaliação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Atualize o valor atual de {ativo?.nome}.
          </p>
          <label className="space-y-2 block">
            <span className="text-sm font-medium">Valor avaliado *</span>
            <Input type="number" step="0.01" value={valor} onChange={(event) => setValor(event.target.value)} required />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium">Data da avaliação</span>
            <Input type="date" value={dataAvaliacao} onChange={(event) => setDataAvaliacao(event.target.value)} />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm font-medium">Avaliador</span>
            <Input value={avaliador} onChange={(event) => setAvaliador(event.target.value)} />
          </label>
          <div className="flex justify-end">
            <Button type="submit" disabled={createAvaliacao.isPending}>
              Registrar avaliação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
