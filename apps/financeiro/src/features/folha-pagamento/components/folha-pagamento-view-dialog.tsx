'use client'

import { ArrowLeftIcon, EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SelectSearchable } from '@/components/select-searchable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFuncionarios } from '@/hooks/use-funcionarios'
import {
  useCreateFolhaItem,
  useDeleteFolhaItem,
  useFolhaPagamento,
  useRubricasFolha,
  useUpdateFolhaItem,
} from '@/hooks/use-folha-pagamento'
import { formatCurrency } from '@/lib/export-utils'

import { labelRubricaItem, resolveRubricaIdFromItem } from '../lib/folha-item'

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

function labelFuncionario(f: any) {
  return (
    f?.pessoa?.fisica?.nome ??
    f?.pessoa?.juridica?.nome_fantasia ??
    f?.matricula ??
    '—'
  )
}

function tipoFolhaLabel(value?: string) {
  return tiposFolha.find((tipo) => tipo.value === value)?.label ?? value ?? '—'
}

function rubricaOptionLabel(rubrica: { nome: string; natureza: string }) {
  return `${rubrica.nome} · ${naturezaLabels[rubrica.natureza] ?? rubrica.natureza}`
}

const defaultItemForm = () => ({
  funcionario_id: '',
  rubrica_id: '',
  natureza: '' as string,
  descricao: '',
  valor: 0,
})

type FolhaResumo = {
  id: string
  competencia: string
  tipo: string
  status: string
}

type DialogView = 'list' | 'item-form'

type FolhaPagamentoViewDialogProps = {
  org: string
  folha: FolhaResumo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FolhaPagamentoViewDialog({
  org,
  folha,
  open,
  onOpenChange,
}: FolhaPagamentoViewDialogProps) {
  const [view, setView] = useState<DialogView>('list')
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState(defaultItemForm())
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [searchFuncionario, setSearchFuncionario] = useState('')

  const folhaId = folha?.id
  const { data: folhaDetalhe, isLoading } = useFolhaPagamento(org, open ? folhaId : undefined)
  const tipoFolhaAtual = folha?.tipo ?? folhaDetalhe?.tipo
  const { data: rubricasData, isLoading: isLoadingRubricas } = useRubricasFolha(org, {
    tipo_folha: tipoFolhaAtual,
  })
  const { data: funcionariosData, isLoading: isLoadingFuncionarios } = useFuncionarios(org, {
    search: searchFuncionario,
    limit: 50,
  })

  const updateFolhaItem = useUpdateFolhaItem(org)
  const deleteFolhaItem = useDeleteFolhaItem(org)
  const createFolhaItem = useCreateFolhaItem(org)

  const rubricas = rubricasData?.rubricas ?? []
  const funcionarios = funcionariosData?.funcionarios ?? []
  const itens = folhaDetalhe?.itens ?? []
  const isAberta = folhaDetalhe?.status === 'ABERTA'

  const funcionarioOptions = useMemo(() => {
    const porId = new Map<string, { value: string; label: string }>()
    for (const f of funcionarios) {
      porId.set(f.id, {
        value: f.id,
        label: `${labelFuncionario(f)}${f.matricula ? ` · ${f.matricula}` : ''}`,
      })
    }
    if (editingItemId) {
      const itemEmEdicao = itens.find((item: any) => item.id === editingItemId)
      const funcionarioItem = itemEmEdicao?.funcionario
      if (funcionarioItem?.id && !porId.has(funcionarioItem.id)) {
        porId.set(funcionarioItem.id, {
          value: funcionarioItem.id,
          label: `${labelFuncionario(funcionarioItem)}${funcionarioItem.matricula ? ` · ${funcionarioItem.matricula}` : ''}`,
        })
      }
    }
    return Array.from(porId.values())
  }, [funcionarios, editingItemId, itens])

  const rubricasParaSelect = useMemo(() => {
    const porId = new Map<string, any>()
    for (const rubrica of rubricas) {
      porId.set(rubrica.id, rubrica)
    }
    if (editingItemId) {
      const itemEmEdicao = itens.find((item: any) => item.id === editingItemId)
      const rubricaItem = itemEmEdicao?.rubrica
      if (rubricaItem?.id && !porId.has(rubricaItem.id)) {
        porId.set(rubricaItem.id, rubricaItem)
      }
    }
    return Array.from(porId.values())
  }, [rubricas, editingItemId, itens])

  const selectedRubrica =
    rubricasParaSelect.find(
      (rubrica: any) => String(rubrica.id) === String(itemForm.rubrica_id),
    ) ??
    (editingItemId
      ? itens.find((item: any) => item.id === editingItemId)?.rubrica
      : undefined)

  const naturezaExibida = selectedRubrica
    ? (naturezaLabels[selectedRubrica.natureza] ?? selectedRubrica.natureza)
    : itemForm.natureza
      ? (naturezaLabels[itemForm.natureza] ?? itemForm.natureza)
      : ''

  const rubricaOptions = useMemo(() => {
    const porId = new Map<string, { value: string; label: string }>()
    for (const rubrica of rubricasParaSelect) {
      porId.set(String(rubrica.id), {
        value: String(rubrica.id),
        label: rubricaOptionLabel(rubrica),
      })
    }
    if (selectedRubrica?.id && !porId.has(String(selectedRubrica.id))) {
      porId.set(String(selectedRubrica.id), {
        value: String(selectedRubrica.id),
        label: rubricaOptionLabel(selectedRubrica),
      })
    }
    return Array.from(porId.values())
  }, [rubricasParaSelect, selectedRubrica])

  const resetItemForm = useCallback(() => {
    setItemForm(defaultItemForm())
    setEditingItemId(null)
    setSearchFuncionario('')
  }, [])

  const goToList = useCallback(() => {
    setView('list')
    resetItemForm()
  }, [resetItemForm])

  useEffect(() => {
    if (!open) {
      setView('list')
      setDeleteItemId(null)
      resetItemForm()
    }
  }, [open, resetItemForm])

  useEffect(() => {
    if (view !== 'item-form' || !editingItemId || itemForm.rubrica_id) return

    const item = itens.find((entry: any) => entry.id === editingItemId)
    if (!item || rubricasParaSelect.length === 0) return

    const resolvedId = resolveRubricaIdFromItem(item, rubricasParaSelect)
    if (!resolvedId) return

    const rubrica = rubricasParaSelect.find((entry) => String(entry.id) === resolvedId)
    setItemForm((prev) => ({
      ...prev,
      rubrica_id: resolvedId,
      natureza: prev.natureza || rubrica?.natureza || item.natureza || '',
      descricao: prev.descricao || item.descricao || rubrica?.nome || '',
    }))
  }, [view, editingItemId, itemForm.rubrica_id, itens, rubricasParaSelect])

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      goToList()
    }
    onOpenChange(nextOpen)
  }

  function openEditItem(item: any) {
    const rubricasBase = [...rubricas]
    if (item.rubrica?.id && !rubricasBase.some((entry) => String(entry.id) === String(item.rubrica.id))) {
      rubricasBase.push(item.rubrica)
    }
    const rubricaId = resolveRubricaIdFromItem(item, rubricasBase)
    const rubrica = rubricasBase.find((entry) => String(entry.id) === rubricaId) ?? item.rubrica

    setEditingItemId(item.id)
    setItemForm({
      funcionario_id: item.funcionario_id,
      rubrica_id: rubricaId,
      natureza: item.natureza ?? rubrica?.natureza ?? '',
      descricao: item.descricao ?? rubrica?.nome ?? '',
      valor: Number(item.valor),
    })
    setSearchFuncionario('')
    setView('item-form')
  }

  function openNewItem() {
    resetItemForm()
    setView('item-form')
  }

  async function handleSaveItem() {
    if (!folhaId || !itemForm.rubrica_id) return

    const { natureza: _natureza, ...payload } = itemForm

    if (editingItemId) {
      await updateFolhaItem.mutateAsync({
        folhaId,
        itemId: editingItemId,
        ...payload,
      })
    } else {
      await createFolhaItem.mutateAsync({
        folhaId,
        ...payload,
      })
    }

    goToList()
  }

  async function handleDeleteItem() {
    if (!folhaId || !deleteItemId) return
    await deleteFolhaItem.mutateAsync({ folhaId, itemId: deleteItemId })
    setDeleteItemId(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-4xl">
          {view === 'list' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <EyeIcon className="h-5 w-5 text-muted-foreground" />
                  Competência {folha?.competencia ?? '—'}
                  <span className="text-muted-foreground">·</span>
                  {tipoFolhaLabel(folha?.tipo)}
                </DialogTitle>
                <DialogDescription>
                  Visualize os lançamentos desta folha de pagamento.
                  {isAberta ? ' Enquanto a folha estiver aberta, você pode editar e excluir itens.' : null}
                </DialogDescription>
              </DialogHeader>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando folha...</p>
              ) : folhaDetalhe ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{folhaDetalhe.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Proventos</p>
                      <p className="font-semibold">{formatCurrency(folhaDetalhe.total_proventos)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Descontos</p>
                      <p className="font-semibold">{formatCurrency(folhaDetalhe.total_descontos)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Encargos</p>
                      <p className="font-semibold">{formatCurrency(folhaDetalhe.total_encargos)}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Líquido</p>
                      <p className="font-semibold">{formatCurrency(folhaDetalhe.total_liquido)}</p>
                    </div>
                  </div>

                  {isAberta ? (
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="outline" onClick={openNewItem}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Novo lançamento
                      </Button>
                    </div>
                  ) : null}

                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Funcionário</TableHead>
                          <TableHead>Rubrica</TableHead>
                          <TableHead>Natureza</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          {isAberta ? <TableHead className="w-[100px] text-right">Ações</TableHead> : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={isAberta ? 6 : 5}
                              className="text-center text-muted-foreground"
                            >
                              Nenhum lançamento nesta competência.
                            </TableCell>
                          </TableRow>
                        ) : (
                          itens.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>{labelFuncionario(item.funcionario)}</TableCell>
                              <TableCell>{labelRubricaItem(item, rubricas)}</TableCell>
                              <TableCell>{naturezaLabels[item.natureza] ?? item.natureza}</TableCell>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                              {isAberta ? (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      aria-label="Editar item"
                                      onClick={() => openEditItem(item)}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="text-destructive hover:text-destructive"
                                      aria-label="Excluir item"
                                      onClick={() => setDeleteItemId(item.id)}
                                    >
                                      <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-start gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0"
                    aria-label="Voltar para a lista"
                    onClick={goToList}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  <div className="space-y-1">
                    <DialogTitle>{editingItemId ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
                    <DialogDescription>
                      {folha ? (
                        <>
                          Competência{' '}
                          <span className="font-medium text-foreground">{folha.competencia}</span>
                          {' · '}
                          <span className="font-medium text-foreground">{tipoFolhaLabel(folha.tipo)}</span>
                        </>
                      ) : null}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1 md:col-span-2">
                  <Label>Rubrica</Label>
                  <SelectSearchable
                    options={rubricaOptions}
                    value={itemForm.rubrica_id}
                    onValueChange={(value) => {
                      const rubrica = rubricasParaSelect.find(
                        (entry) => String(entry.id) === String(value),
                      )
                      setItemForm({
                        ...itemForm,
                        rubrica_id: String(value),
                        natureza: rubrica?.natureza ?? '',
                        descricao: itemForm.descricao || rubrica?.nome || '',
                      })
                    }}
                    placeholder={
                      isLoadingRubricas ? 'Carregando rubricas...' : 'Selecione a rubrica'
                    }
                    isLoading={isLoadingRubricas}
                    disabled={isLoadingRubricas}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Natureza</Label>
                  <Input value={naturezaExibida} disabled />
                </div>
                <div className="space-y-1">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={itemForm.valor === 0 ? '' : itemForm.valor}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        valor: e.target.value === '' ? 0 : Number(e.target.value),
                      })
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={goToList}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={
                    updateFolhaItem.isPending ||
                    createFolhaItem.isPending ||
                    !itemForm.rubrica_id ||
                    !itemForm.funcionario_id
                  }
                  onClick={handleSaveItem}
                >
                  {editingItemId ? 'Salvar alterações' : 'Adicionar item'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItemId} onOpenChange={(nextOpen) => !nextOpen && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item da folha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={deleteFolhaItem.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFolhaItem.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
