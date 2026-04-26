'use client'

import { useParams } from 'next/navigation'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { CheckCircle2Icon, DownloadIcon, FileTextIcon, LockIcon, PlusIcon, RotateCcwIcon, Undo2Icon } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

import { SelectSearchable } from '@/components/select-searchable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFuncionarios } from '@/hooks/use-funcionarios'
import {
  useCreateFolhaItem,
  useCreateFolhaPagamento,
  useFolhaActions,
  useFolhaPagamentoRelatorio,
  useFolhasPagamento,
  useRubricasFolha,
} from '@/hooks/use-folha-pagamento'

import { FolhaPagamentoRelatorioPDF } from './folha-pagamento-relatorio-pdf'
import { FolhaPagamentoRelatorioTable } from './folha-pagamento-relatorio-table'

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
  rubrica_id: '',
  descricao: '',
  valor: 0,
})

const tiposFolha = [
  { value: 'FOLHA_MENSAL', label: 'Folha de pagamento' },
  { value: 'FERIAS', label: 'Férias' },
  { value: 'DECIMO_TERCEIRO', label: '13º Salário' },
  { value: 'RESCISAO', label: 'Rescisão' },
]

const naturezaLabels: Record<string, string> = {
  PROVENTO: 'Provento',
  DESCONTO: 'Desconto',
  ENCARGO: 'Encargo',
}

const statusFolha = ['ABERTA', 'FECHADA', 'PAGA', 'CANCELADA']

const defaultRelatorioFilters = () => ({
  competencia: '',
  tipo: 'all-tipos',
  status: 'all-status',
  funcionario_id: '',
  rubrica_id: 'all-rubricas',
  natureza: 'all-naturezas',
  data_fechamento_inicio: '',
  data_fechamento_fim: '',
  data_pagamento_inicio: '',
  data_pagamento_fim: '',
})

function tipoFolhaLabel(value?: string) {
  return tiposFolha.find((tipo) => tipo.value === value)?.label ?? value ?? '—'
}

function ActionIconButton({
  label,
  className,
  variant,
  onClick,
  children,
}: {
  label: string
  className?: string
  variant?: 'default' | 'outline'
  onClick: () => void
  children: ReactNode
}) {
  return (
    <span className="group/action relative inline-flex">
      <Button
        size="icon"
        variant={variant}
        className={className}
        aria-label={label}
        onClick={onClick}
      >
        {children}
      </Button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover/action:opacity-100 group-focus-within/action:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}

export function FolhaPagamentoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [activeView, setActiveView] = useState<'folhas' | 'relatorio'>('folhas')
  const [competencia, setCompetencia] = useState('')
  const [tipoFolha, setTipoFolha] = useState('FOLHA_MENSAL')
  const [searchFuncionario, setSearchFuncionario] = useState('')
  const [searchFuncionarioRelatorio, setSearchFuncionarioRelatorio] = useState('')
  const [relatorioFilters, setRelatorioFilters] = useState(defaultRelatorioFilters())
  const [appliedRelatorioFilters, setAppliedRelatorioFilters] = useState<Record<string, any> | null>(null)
  const [novoLancamentoOpen, setNovoLancamentoOpen] = useState(false)
  const [folhaParaItem, setFolhaParaItem] = useState<{ id: string; competencia: string; tipo: string } | null>(null)
  const [itemForm, setItemForm] = useState<any>(defaultItemForm())

  const { data } = useFolhasPagamento(slug, {})
  const { data: rubricasData, isLoading: isLoadingRubricas } = useRubricasFolha(slug, {
    tipo_folha: folhaParaItem?.tipo || tipoFolha,
  })
  const { data: rubricasRelatorioData } = useRubricasFolha(
    slug,
    relatorioFilters.tipo !== 'all-tipos' ? { tipo_folha: relatorioFilters.tipo } : {},
  )
  const { data: funcionariosData, isLoading: isLoadingFuncionarios } = useFuncionarios(slug, {
    search: searchFuncionario,
    limit: 50,
  })
  const { data: funcionariosRelatorioData, isLoading: isLoadingFuncionariosRelatorio } = useFuncionarios(slug, {
    search: searchFuncionarioRelatorio,
    limit: 50,
  })
  const { data: relatorioData, isLoading: isLoadingRelatorio } = useFolhaPagamentoRelatorio(
    slug,
    appliedRelatorioFilters,
  )
  const createFolha = useCreateFolhaPagamento(slug)
  const createFolhaItem = useCreateFolhaItem(slug)
  const { closeFolha, reopenFolha, payFolha, unpayFolha } = useFolhaActions(slug)

  const folhas = data?.folhas ?? []
  const rubricas = rubricasData?.rubricas ?? []
  const rubricasRelatorio = rubricasRelatorioData?.rubricas ?? []
  const pagination = data?.pagination ?? { count: 0 }
  const funcionarios = funcionariosData?.funcionarios ?? []
  const funcionariosRelatorio = funcionariosRelatorioData?.funcionarios ?? []
  const funcionarioOptions = useMemo(
    () =>
      funcionarios.map((f: any) => ({
        value: f.id,
        label: `${labelFuncionario(f)}${f.matricula ? ` · ${f.matricula}` : ''}`,
      })),
    [funcionarios],
  )
  const funcionarioRelatorioOptions = useMemo(
    () =>
      funcionariosRelatorio.map((f: any) => ({
        value: f.id,
        label: `${labelFuncionario(f)}${f.matricula ? ` · ${f.matricula}` : ''}`,
      })),
    [funcionariosRelatorio],
  )

  const selectedRubrica = rubricas.find((rubrica: any) => rubrica.id === itemForm.rubrica_id)

  const openNovoLancamentoModal = useCallback((folha: { id: string; competencia: string; tipo: string }) => {
    setFolhaParaItem({ id: folha.id, competencia: folha.competencia, tipo: folha.tipo })
    setItemForm(defaultItemForm())
    setSearchFuncionario('')
    setNovoLancamentoOpen(true)
  }, [])

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: 'competencia', header: 'Competência' },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => tipoFolhaLabel(row.original.tipo),
      },
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
        cell: ({ row }) => {
          const status = row.original.status
          const isAberta = status === 'ABERTA'
          const isFechada = status === 'FECHADA'
          const isPaga = status === 'PAGA'

          return (
            <div className="flex flex-wrap gap-2">
              {isAberta && (
                <>
                  <ActionIconButton
                    label="Adicionar novo lançamento nesta folha"
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() =>
                      openNovoLancamentoModal({
                        id: row.original.id,
                        competencia: row.original.competencia,
                        tipo: row.original.tipo,
                      })
                    }
                  >
                    <PlusIcon className="h-4 w-4" />
                  </ActionIconButton>
                  <ActionIconButton
                    label="Fechar folha de pagamento"
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    onClick={() => closeFolha.mutate(row.original.id)}
                  >
                    <LockIcon className="h-4 w-4" />
                  </ActionIconButton>
                </>
              )}
              {isFechada && (
                <>
                  <ActionIconButton
                    label="Reabrir folha de pagamento"
                    variant="outline"
                    className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                    onClick={() => reopenFolha.mutate(row.original.id)}
                  >
                    <RotateCcwIcon className="h-4 w-4" />
                  </ActionIconButton>
                  <ActionIconButton
                    label="Marcar folha de pagamento como paga"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => payFolha.mutate(row.original.id)}
                  >
                    <CheckCircle2Icon className="h-4 w-4" />
                  </ActionIconButton>
                </>
              )}
              {isPaga && (
                <ActionIconButton
                  label="Estornar pagamento da folha"
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                  onClick={() => unpayFolha.mutate(row.original.id)}
                >
                  <Undo2Icon className="h-4 w-4" />
                </ActionIconButton>
              )}
            </div>
          )
        },
      },
    ],
    [closeFolha, reopenFolha, payFolha, unpayFolha, openNovoLancamentoModal],
  )

  function exportCSV() {
    const lines = ['competencia,tipo,status,total_proventos,total_descontos,total_encargos,total_liquido']
    for (const folha of folhas) {
      lines.push(
        `${folha.competencia},${folha.tipo},${folha.status},${folha.total_proventos},${folha.total_descontos},${folha.total_encargos},${folha.total_liquido}`,
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `folha-pagamento-${Date.now()}.csv`
    a.click()
  }

  function visualizarRelatorio() {
    const filters = {
      competencia: relatorioFilters.competencia || undefined,
      tipo: relatorioFilters.tipo === 'all-tipos' ? undefined : relatorioFilters.tipo,
      status: relatorioFilters.status === 'all-status' ? undefined : relatorioFilters.status,
      funcionario_id: relatorioFilters.funcionario_id || undefined,
      rubrica_id: relatorioFilters.rubrica_id === 'all-rubricas' ? undefined : relatorioFilters.rubrica_id,
      natureza: relatorioFilters.natureza === 'all-naturezas' ? undefined : relatorioFilters.natureza,
      data_fechamento_inicio: relatorioFilters.data_fechamento_inicio || undefined,
      data_fechamento_fim: relatorioFilters.data_fechamento_fim || undefined,
      data_pagamento_inicio: relatorioFilters.data_pagamento_inicio || undefined,
      data_pagamento_fim: relatorioFilters.data_pagamento_fim || undefined,
    }

    setAppliedRelatorioFilters(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)))
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
            <div className="min-w-[170px] flex-1 space-y-1 sm:max-w-[13rem]">
              <Label className="text-xs text-muted-foreground">Tipo de folha</Label>
              <Select value={tipoFolha} onValueChange={setTipoFolha}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tiposFolha.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createFolha.mutate({ competencia, tipo: tipoFolha })}
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

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeView === 'folhas' ? 'default' : 'outline'}
          onClick={() => setActiveView('folhas')}
        >
          Folhas
        </Button>
        <Button
          type="button"
          variant={activeView === 'relatorio' ? 'default' : 'outline'}
          onClick={() => setActiveView('relatorio')}
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          Relatório
        </Button>
      </div>

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
                  {' · '}
                  <span className="font-medium text-foreground">{tipoFolhaLabel(folhaParaItem.tipo)}</span>
                  <span className="text-muted-foreground"> (folha selecionada automaticamente).</span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {folhaParaItem ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-1 md:col-span-2">
                <Label>Rubrica</Label>
                <Select
                  value={itemForm.rubrica_id}
                  onValueChange={(value) => {
                    const rubrica = rubricas.find((item: any) => item.id === value)
                    setItemForm({
                      ...itemForm,
                      rubrica_id: value,
                      descricao: itemForm.descricao || rubrica?.nome || '',
                    })
                  }}
                  disabled={isLoadingRubricas}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingRubricas ? 'Carregando rubricas...' : 'Selecione a rubrica'} />
                  </SelectTrigger>
                  <SelectContent>
                    {rubricas.map((rubrica: any) => (
                      <SelectItem key={rubrica.id} value={rubrica.id}>
                        {rubrica.nome} · {naturezaLabels[rubrica.natureza] ?? rubrica.natureza}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Natureza</Label>
                <Input value={selectedRubrica ? naturezaLabels[selectedRubrica.natureza] ?? selectedRubrica.natureza : ''} disabled />
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
              disabled={createFolhaItem.isPending || !folhaParaItem || !itemForm.rubrica_id}
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

      {activeView === 'folhas' ? (
        <DataTable
          columns={columns}
          data={folhas}
          totalItems={pagination.count ?? 0}
          pageSizeOptions={[50, 100, 200, 500, 1000]}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtros do relatório</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label>Competência</Label>
                <Input
                  placeholder="MM/AAAA"
                  value={relatorioFilters.competencia}
                  onChange={(e) => setRelatorioFilters({ ...relatorioFilters, competencia: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo de folha</Label>
                <Select
                  value={relatorioFilters.tipo}
                  onValueChange={(value) =>
                    setRelatorioFilters({ ...relatorioFilters, tipo: value, rubrica_id: 'all-rubricas' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-tipos">Todos</SelectItem>
                    {tiposFolha.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={relatorioFilters.status}
                  onValueChange={(value) => setRelatorioFilters({ ...relatorioFilters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">Todos</SelectItem>
                    {statusFolha.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Natureza</Label>
                <Select
                  value={relatorioFilters.natureza}
                  onValueChange={(value) => setRelatorioFilters({ ...relatorioFilters, natureza: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-naturezas">Todas</SelectItem>
                    {Object.entries(naturezaLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Funcionário</Label>
                <SelectSearchable
                  options={funcionarioRelatorioOptions}
                  value={relatorioFilters.funcionario_id}
                  onValueChange={(value) => setRelatorioFilters({ ...relatorioFilters, funcionario_id: value })}
                  onSearchChange={setSearchFuncionarioRelatorio}
                  placeholder="Todos os funcionários"
                  isLoading={isLoadingFuncionariosRelatorio}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Rubrica</Label>
                <Select
                  value={relatorioFilters.rubrica_id}
                  onValueChange={(value) => setRelatorioFilters({ ...relatorioFilters, rubrica_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-rubricas">Todas</SelectItem>
                    {rubricasRelatorio.map((rubrica: any) => (
                      <SelectItem key={rubrica.id} value={rubrica.id}>
                        {rubrica.nome} · {tipoFolhaLabel(rubrica.tipo_folha)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fechamento de</Label>
                <Input
                  type="date"
                  value={relatorioFilters.data_fechamento_inicio}
                  onChange={(e) =>
                    setRelatorioFilters({ ...relatorioFilters, data_fechamento_inicio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Fechamento até</Label>
                <Input
                  type="date"
                  value={relatorioFilters.data_fechamento_fim}
                  onChange={(e) =>
                    setRelatorioFilters({ ...relatorioFilters, data_fechamento_fim: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Pagamento de</Label>
                <Input
                  type="date"
                  value={relatorioFilters.data_pagamento_inicio}
                  onChange={(e) =>
                    setRelatorioFilters({ ...relatorioFilters, data_pagamento_inicio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Pagamento até</Label>
                <Input
                  type="date"
                  value={relatorioFilters.data_pagamento_fim}
                  onChange={(e) =>
                    setRelatorioFilters({ ...relatorioFilters, data_pagamento_fim: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-4">
                <Button type="button" onClick={visualizarRelatorio} disabled={isLoadingRelatorio}>
                  Visualizar relatório
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRelatorioFilters(defaultRelatorioFilters())
                    setAppliedRelatorioFilters(null)
                    setSearchFuncionarioRelatorio('')
                  }}
                >
                  Limpar filtros
                </Button>
                {relatorioData ? <FolhaPagamentoRelatorioPDF data={relatorioData} /> : null}
              </div>
            </CardContent>
          </Card>

          {isLoadingRelatorio ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Carregando relatório...</CardContent>
            </Card>
          ) : (
            <FolhaPagamentoRelatorioTable data={relatorioData} />
          )}
        </div>
      )}
    </div>
  )
}
