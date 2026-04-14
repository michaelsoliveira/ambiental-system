'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DownloadIcon, PlusIcon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/ui/table/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCreateFolhaItem, useCreateFolhaPagamento, useFolhaActions, useFolhasPagamento } from '@/hooks/use-folha-pagamento'

export function FolhaPagamentoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [competencia, setCompetencia] = useState('')
  const [selectedFolhaId, setSelectedFolhaId] = useState<string>('')
  const [itemForm, setItemForm] = useState<any>({
    funcionario_id: '',
    tipo: 'SALARIO',
    natureza: 'PROVENTO',
    descricao: '',
    valor: 0,
  })

  const { data } = useFolhasPagamento(slug, {})
  const createFolha = useCreateFolhaPagamento(slug)
  const createFolhaItem = useCreateFolhaItem(slug)
  const { closeFolha, reopenFolha, payFolha } = useFolhaActions(slug)

  const folhas = data?.folhas ?? []
  const pagination = data?.pagination ?? { count: 0 }

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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedFolhaId(row.original.id)}>
              Selecionar
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
    [closeFolha, reopenFolha, payFolha],
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
      <div className="flex items-start justify-between">
        <Heading
          title="Folha de Pagamento"
          description="Gestão completa de competências, itens e fechamento mensal."
        />
        <Button variant="outline" onClick={exportCSV}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Abrir nova competência</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="MM/AAAA"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
          />
          <Button onClick={() => createFolha.mutate({ competencia })}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Criar folha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar item na folha selecionada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          <div className="space-y-1">
            <Label>Folha ID</Label>
            <Input value={selectedFolhaId} onChange={(e) => setSelectedFolhaId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Funcionário ID</Label>
            <Input onChange={(e) => setItemForm({ ...itemForm, funcionario_id: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Input onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value })} placeholder="SALARIO, INSS..." />
          </div>
          <div className="space-y-1">
            <Label>Natureza</Label>
            <Input onChange={(e) => setItemForm({ ...itemForm, natureza: e.target.value })} placeholder="PROVENTO, DESCONTO..." />
          </div>
          <div className="space-y-1">
            <Label>Valor</Label>
            <Input type="number" onChange={(e) => setItemForm({ ...itemForm, valor: Number(e.target.value) })} />
          </div>
          <div className="col-span-full">
            <Button
              onClick={() =>
                createFolhaItem.mutate({
                  folhaId: selectedFolhaId,
                  ...itemForm,
                })
              }
            >
              Adicionar item
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={folhas}
        totalItems={pagination.count ?? 0}
        pageSizeOptions={[50, 100, 200, 500, 1000]}
      />
    </div>
  )
}
