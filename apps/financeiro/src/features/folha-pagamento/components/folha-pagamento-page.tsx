'use client'

import { useParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { DownloadIcon, PlusIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import { SelectSearchable } from '@/components/select-searchable'
import { DataTable } from '@/components/ui/table/data-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useFuncionarios } from '@/hooks/use-funcionarios'
import { useCreateFolhaItem, useCreateFolhaPagamento, useFolhaActions, useFolhasPagamento } from '@/hooks/use-folha-pagamento'

function labelFuncionario(f: any) {
  return (
    f?.pessoa?.fisica?.nome ??
    f?.pessoa?.juridica?.nome_fantasia ??
    f?.matricula ??
    '—'
  )
}

const defaultItemForm = () => ({
  funcionario_id: '',
  tipo: 'SALARIO',
  natureza: 'PROVENTO',
  descricao: '',
  valor: 0,
})

export function FolhaPagamentoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [competencia, setCompetencia] = useState('')
  const [searchFuncionario, setSearchFuncionario] = useState('')
  const [novoLancamentoOpen, setNovoLancamentoOpen] = useState(false)
  const [folhaParaItem, setFolhaParaItem] = useState<{ id: string; competencia: string } | null>(null)
  const [itemForm, setItemForm] = useState<any>(defaultItemForm())

  const { data } = useFolhasPagamento(slug, {})
  const { data: funcionariosData, isLoading: isLoadingFuncionarios } = useFuncionarios(slug, {
    search: searchFuncionario,
    limit: 50,
  })
  const createFolha = useCreateFolhaPagamento(slug)
  const createFolhaItem = useCreateFolhaItem(slug)
  const { closeFolha, reopenFolha, payFolha } = useFolhaActions(slug)

  const folhas = data?.folhas ?? []
  const pagination = data?.pagination ?? { count: 0 }
  const funcionarios = funcionariosData?.funcionarios ?? []
  const funcionarioOptions = useMemo(
    () =>
      funcionarios.map((f: any) => ({
        value: f.id,
        label: `${labelFuncionario(f)}${f.matricula ? ` · ${f.matricula}` : ''}`,
      })),
    [funcionarios],
  )

  const openNovoLancamentoModal = useCallback((folha: { id: string; competencia: string }) => {
    setFolhaParaItem({ id: folha.id, competencia: folha.competencia })
    setItemForm(defaultItemForm())
    setSearchFuncionario('')
    setNovoLancamentoOpen(true)
  }, [])

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: 'competencia', header: 'Competência' },
      { accessorKey: 'status', header: 'Status' },
      {
        accessorKey: 'total_proventos',
        header: 'Proventos',
        cell: ({ row }) => Number(row.original.total_proventos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        accessorKey: 'total_descontos',
        header: 'Descontos',
        cell: ({ row }) => Number(row.original.total_descontos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        accessorKey: 'total_liquido',
        header: 'Líquido',
        cell: ({ row }) => Number(row.original.total_liquido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                openNovoLancamentoModal({
                  id: row.original.id,
                  competencia: row.original.competencia,
                })
              }
            >
              Novo lançamento
            </Button>
            <Button size="sm" variant="outline" onClick={() => closeFolha.mutate(row.original.id)}>
              Fechar
            </Button>
            <Button size="sm" variant="outline" onClick={() => reopenFolha.mutate(row.original.id)}>
              Reabrir
            </Button>
            <Button size="sm" onClick={() => payFolha.mutate(row.original.id)}>
              Pagar
            </Button>
          </div>
        ),
      },
    ],
    [closeFolha, reopenFolha, payFolha, openNovoLancamentoModal],
  )

  function exportCSV() {
    const lines = ['competencia,status,total_proventos,total_descontos,total_encargos,total_liquido']
    for (const folha of folhas) {
      lines.push(
        `${folha.competencia},${folha.status},${folha.total_proventos},${folha.total_descontos},${folha.total_encargos},${folha.total_liquido}`,
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `folha-pagamento-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Heading
          title="Folha de Pagamento"
          description="Gestão completa de competências, itens e fechamento mensal."
        />
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:max-w-2xl lg:justify-end">
          <Button variant="outline" onClick={exportCSV} className="w-full sm:w-auto">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:flex-initial">
            <div className="min-w-[140px] flex-1 space-y-1 sm:max-w-[11rem]">
              <Label className="text-xs text-muted-foreground">Nova competência (MM/AAAA)</Label>
              <Input
                placeholder="MM/AAAA"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>
            <Button
              onClick={() => createFolha.mutate({ competencia })}
              className="w-full sm:w-auto"
              disabled={createFolha.isPending}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Criar Folha
            </Button>
          </div>
        </div>
      </div>
      <Separator />

      <Dialog
        open={novoLancamentoOpen}
        onOpenChange={(open) => {
          setNovoLancamentoOpen(open)
          if (!open) {
            setFolhaParaItem(null)
            setItemForm(defaultItemForm())
            setSearchFuncionario('')
          }
        }}
      >
        <DialogContent className="md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>
              {folhaParaItem ? (
                <>
                  Lançamento vinculado à competência{' '}
                  <span className="font-medium text-foreground">{folhaParaItem.competencia}</span>
                  <span className="text-muted-foreground"> (folha selecionada automaticamente).</span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {folhaParaItem ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Input
                  value={itemForm.tipo}
                  onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value })}
                  placeholder="SALARIO, INSS..."
                />
              </div>
              <div className="space-y-1">
                <Label>Natureza</Label>
                <Input
                  value={itemForm.natureza}
                  onChange={(e) => setItemForm({ ...itemForm, natureza: e.target.value })}
                  placeholder="PROVENTO, DESCONTO..."
                />
              </div>
              <div className="space-y-1">
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={itemForm.valor === 0 ? '' : itemForm.valor}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, valor: e.target.value === '' ? 0 : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Funcionário</Label>
                <SelectSearchable
                  options={funcionarioOptions}
                  value={itemForm.funcionario_id}
                  onValueChange={(value) => setItemForm({ ...itemForm, funcionario_id: value })}
                  onSearchChange={setSearchFuncionario}
                  placeholder="Buscar funcionário..."
                  isLoading={isLoadingFuncionarios}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={itemForm.descricao}
                  onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNovoLancamentoOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={createFolhaItem.isPending || !folhaParaItem}
              onClick={async () => {
                if (!folhaParaItem) return
                await createFolhaItem.mutateAsync({
                  folhaId: folhaParaItem.id,
                  ...itemForm,
                })
                setNovoLancamentoOpen(false)
                setFolhaParaItem(null)
                setItemForm(defaultItemForm())
                setSearchFuncionario('')
              }}
            >
              Adicionar item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={folhas}
        totalItems={pagination.count ?? 0}
        pageSizeOptions={[50, 100, 200, 500, 1000]}
      />
    </div>
  )
}
