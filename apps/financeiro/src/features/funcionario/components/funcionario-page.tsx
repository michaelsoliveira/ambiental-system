'use client'

import { ColumnDef } from '@tanstack/react-table'
import { FilePlus2Icon, FilterIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { SelectSearchable } from '@/components/select-searchable'
import { DataTable } from '@/components/ui/table/data-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Heading } from '@/components/ui/heading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCargosFuncionario, useCreateCargoFuncionario } from '@/hooks/use-cargos-funcionario'
import { useEmpresas } from '@/hooks/use-empresas'
import { useCreateFolhaItem, useFolhasPagamento, useRubricasFolha } from '@/hooks/use-folha-pagamento'
import { useCreateFuncionario, useDeleteFuncionario, useFuncionarios, useUpdateFuncionario } from '@/hooks/use-funcionarios'
import { usePessoas } from '@/hooks/use-pessoas'

const defaultFuncionarioForm = () => ({
  pessoa_id: '',
  empresa_id: '',
  matricula: '',
  cargo_id: '',
  departamento: '',
  tipo_contrato: 'CLT',
  ativo: true,
})

const defaultFolhaItemForm = () => ({
  folhaId: '',
  rubrica_id: '',
  descricao: '',
  valor: 0,
})

const tiposFolhaLabels: Record<string, string> = {
  FOLHA_MENSAL: 'Folha de pagamento',
  FERIAS: 'Férias',
  DECIMO_TERCEIRO: '13º Salário',
  RESCISAO: 'Rescisão',
}

const naturezaLabels: Record<string, string> = {
  PROVENTO: 'Provento',
  DESCONTO: 'Desconto',
  ENCARGO: 'Encargo',
}

export function FuncionarioPage() {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [empresaFilter, setEmpresaFilter] = useState<string>('')
  const [cargoFilter, setCargoFilter] = useState<string>('')
  const [ativoFilter, setAtivoFilter] = useState<string>('')
  const [contratoFilter, setContratoFilter] = useState<string>('')
  const [searchPessoaForm, setSearchPessoaForm] = useState('')
  const [searchEmpresaForm, setSearchEmpresaForm] = useState('')
  const [searchCargoForm, setSearchCargoForm] = useState('')
  const [editingFuncionario, setEditingFuncionario] = useState<any | null>(null)
  const [folhaFuncionario, setFolhaFuncionario] = useState<any | null>(null)
  const [form, setForm] = useState<any>(defaultFuncionarioForm())
  const [folhaItemForm, setFolhaItemForm] = useState<any>(defaultFolhaItemForm())
  const [cargoNome, setCargoNome] = useState('')
  const [cargoSalario, setCargoSalario] = useState(0)
  const [showNewCargoForm, setShowNewCargoForm] = useState(false)

  const { data } = useFuncionarios(slug, {
    search,
    empresa_id: empresaFilter || undefined,
    cargo_id: cargoFilter || undefined,
    ativo: ativoFilter ? ativoFilter === 'true' : undefined,
    tipo_contrato: contratoFilter || undefined,
  })
  const createFuncionario = useCreateFuncionario(slug)
  const updateFuncionario = useUpdateFuncionario(slug)
  const deleteFuncionario = useDeleteFuncionario(slug)
  const createFolhaItem = useCreateFolhaItem(slug)
  const createCargo = useCreateCargoFuncionario(slug)
  const { data: cargosData } = useCargosFuncionario(slug, { search: searchCargoForm, limit: 50 })
  const { data: empresasData } = useEmpresas(slug, { search: searchEmpresaForm, limit: 50 })
  const { data: pessoasData }: any = usePessoas(slug, { search: searchPessoaForm, limit: 50 })
  const { data: folhasAbertasData } = useFolhasPagamento(slug, { status: 'ABERTA', limit: 1000 })
  const folhaSelecionada = folhasAbertasData?.folhas?.find((folha: any) => folha.id === folhaItemForm.folhaId)
  const { data: rubricasData, isLoading: isLoadingRubricas } = useRubricasFolha(
    slug,
    folhaSelecionada?.tipo ? { tipo_folha: folhaSelecionada.tipo } : {},
  )
  const funcionarios = data?.funcionarios ?? []
  const cargos = cargosData?.cargos ?? []
  const empresas = empresasData?.empresas ?? []
  const pessoas = pessoasData?.data ?? pessoasData?.pessoas ?? []
  const folhasAbertas = folhasAbertasData?.folhas ?? []
  const rubricas = rubricasData?.rubricas ?? []
  const pagination = data?.pagination ?? { count: 0 }

  const pessoaOptions = useMemo(
    () =>
      pessoas.map((p: any) => ({
        value: p.id,
        label: p.tipo === 'F' ? p.fisica?.nome : p.juridica?.nome_fantasia,
      })),
    [pessoas],
  )
  const empresaOptions = useMemo(
    () =>
      empresas.map((e: any) => ({
        value: e.id,
        label:
          e?.pessoa?.juridica?.nome_fantasia ??
          e?.pessoa?.juridica?.razao_social ??
          e?.pessoa?.fisica?.nome ??
          `Empresa ${e.id}`,
      })),
    [empresas],
  )
  const cargoOptions = useMemo(
    () =>
      cargos.map((c: any) => ({
        value: c.id,
        label: `${c.nome} (${Number(c.salario_base).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })})`,
      })),
    [cargos],
  )
  const selectedRubrica = rubricas.find((rubrica: any) => rubrica.id === folhaItemForm.rubrica_id)

  function funcionarioNome(funcionario: any) {
    return (
      funcionario?.pessoa?.fisica?.nome ??
      funcionario?.pessoa?.juridica?.nome_fantasia ??
      funcionario?.matricula ??
      'Funcionário'
    )
  }

  function resetFuncionarioForm() {
    setForm(defaultFuncionarioForm())
    setEditingFuncionario(null)
    setCargoNome('')
    setCargoSalario(0)
    setShowNewCargoForm(false)
    setSearchPessoaForm('')
    setSearchEmpresaForm('')
    setSearchCargoForm('')
  }

  function openEditModal(funcionario: any) {
    setEditingFuncionario(funcionario)
    setForm({
      pessoa_id: funcionario.pessoa_id ?? '',
      empresa_id: funcionario.empresa_id ?? '',
      matricula: funcionario.matricula ?? '',
      cargo_id: funcionario.cargo_id ?? '',
      departamento: funcionario.departamento ?? '',
      tipo_contrato: funcionario.tipo_contrato ?? 'CLT',
      ativo: Boolean(funcionario.ativo),
    })
    setOpen(true)
  }

  function openFolhaItemModal(funcionario: any) {
    setFolhaFuncionario(funcionario)
    setFolhaItemForm(defaultFolhaItemForm())
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: 'matricula', header: 'Matrícula' },
      {
        id: 'nome',
        header: 'Nome',
        cell: ({ row }) =>
          row.original?.pessoa?.fisica?.nome ??
          row.original?.pessoa?.juridica?.nome_fantasia ??
          '-',
      },
      {
        id: 'cargo',
        header: 'Cargo',
        cell: ({ row }) => row.original?.cargo_funcionario?.nome ?? '-',
      },
      {
        id: 'empresa',
        header: 'Empresa',
        cell: ({ row }) =>
          row.original?.empresa?.pessoa?.juridica?.nome_fantasia ??
          row.original?.empresa?.pessoa?.juridica?.razao_social ??
          row.original?.empresa?.pessoa?.fisica?.nome ??
          '-',
      },
      { accessorKey: 'departamento', header: 'Departamento' },
      {
        accessorKey: 'cargo_funcionario.salario_base',
        header: 'Salário Base',
        cell: ({ row }) =>
          Number(row.original?.cargo_funcionario?.salario_base ?? 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) => (row.original.ativo ? 'Ativo' : 'Inativo'),
      },
      {
        accessorKey: 'tipo_contrato',
        header: 'Contrato',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditModal(row.original)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openFolhaItemModal(row.original)}>
                <FilePlus2Icon className="mr-2 h-4 w-4" />
                Lançar na folha
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteFuncionario.mutate(row.original.id)}
                className="text-destructive"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [deleteFuncionario, openEditModal, openFolhaItemModal],
  )

  async function handleCreate() {
    const payload = {
      ...form,
      tipo_contrato: form.tipo_contrato ?? 'CLT',
      cargo_id: form.cargo_id || undefined,
      matricula: form.matricula || undefined,
      departamento: form.departamento || undefined,
    }

    if (editingFuncionario) {
      await updateFuncionario.mutateAsync({ id: editingFuncionario.id, ...payload })
    } else {
      await createFuncionario.mutateAsync(payload)
    }
    resetFuncionarioForm()
    setOpen(false)
  }

  async function handleCreateFolhaItem() {
    if (!folhaFuncionario) return

    await createFolhaItem.mutateAsync({
      folhaId: folhaItemForm.folhaId,
      funcionario_id: folhaFuncionario.id,
      rubrica_id: folhaItemForm.rubrica_id,
      descricao: folhaItemForm.descricao,
      valor: folhaItemForm.valor,
    })
    setFolhaFuncionario(null)
    setFolhaItemForm(defaultFolhaItemForm())
  }

  async function handleCreateCargo() {
    const result = await createCargo.mutateAsync({
      nome: cargoNome,
      salario_base: Number(cargoSalario),
      ativo: true,
    })
    setForm((prev: any) => ({ ...prev, cargo_id: result.id }))
    setCargoNome('')
    setCargoSalario(0)
    setShowNewCargoForm(false)
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <div className="flex items-start justify-between">
        <Heading
          title="Funcionários"
          description="Cadastro e gestão dos funcionários utilizados na folha."
        />
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen)
            if (!nextOpen) resetFuncionarioForm()
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="rounded-full p-4 shadow-xl"
              onClick={() => {
                resetFuncionarioForm()
                setOpen(true)
              }}
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFuncionario ? 'Editar funcionário' : 'Novo funcionário'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Pessoa</Label>
                <SelectSearchable
                  options={pessoaOptions}
                  value={form.pessoa_id}
                  onValueChange={(value) => setForm({ ...form, pessoa_id: value })}
                  onSearchChange={setSearchPessoaForm}
                  placeholder="Selecione uma pessoa"
                />
              </div>
              <div className="space-y-1">
                <Label>Empresa</Label>
                <SelectSearchable
                  options={empresaOptions}
                  value={form.empresa_id}
                  onValueChange={(value) => setForm({ ...form, empresa_id: value })}
                  onSearchChange={setSearchEmpresaForm}
                  placeholder="Selecione uma empresa"
                />
              </div>
              <div className="space-y-1">
                <Label>Matrícula</Label>
                <Input value={form.matricula ?? ''} onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Cargo</Label>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <SelectSearchable
                      options={cargoOptions}
                      value={form.cargo_id}
                      onValueChange={(value) => setForm({ ...form, cargo_id: value })}
                      onSearchChange={setSearchCargoForm}
                      placeholder="Selecione um cargo"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowNewCargoForm(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Novo cargo
                  </Button>
                </div>
              </div>
              {showNewCargoForm ? (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Novo cargo (nome)</Label>
                      <Input value={cargoNome} onChange={(e) => setCargoNome(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Novo cargo (salário base)</Label>
                      <Input
                        type="number"
                        value={cargoSalario === 0 ? '' : cargoSalario}
                        onChange={(e) => setCargoSalario(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-row items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateCargo}
                      disabled={createCargo.isPending || !cargoNome || !cargoSalario}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Criar cargo e vincular
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setCargoNome('')
                        setCargoSalario(0)
                        setShowNewCargoForm(false)
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="space-y-1">
                <Label>Departamento</Label>
                <Input
                  value={form.departamento ?? ''}
                  onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo de contrato</Label>
                <Select
                  value={form.tipo_contrato ?? 'CLT'}
                  onValueChange={(value) => setForm({ ...form, tipo_contrato: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">CLT</SelectItem>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="ESTAGIO">Estágio</SelectItem>
                    <SelectItem value="TEMPORARIO">Temporário</SelectItem>
                    <SelectItem value="APRENDIZ">Aprendiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={String(Boolean(form.ativo))}
                  onValueChange={(value) => setForm({ ...form, ativo: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createFuncionario.isPending || updateFuncionario.isPending}>
                {editingFuncionario ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={!!folhaFuncionario}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setFolhaFuncionario(null)
            setFolhaItemForm(defaultFolhaItemForm())
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar item na folha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="font-medium">{folhaFuncionario ? funcionarioNome(folhaFuncionario) : '-'}</p>
            </div>
            <div className="space-y-1">
              <Label>Folha aberta</Label>
              <Select
                value={folhaItemForm.folhaId}
                onValueChange={(value) =>
                  setFolhaItemForm({
                    ...folhaItemForm,
                    folhaId: value,
                    rubrica_id: '',
                    descricao: '',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma folha aberta" />
                </SelectTrigger>
                <SelectContent>
                  {folhasAbertas.map((folha: any) => (
                    <SelectItem key={folha.id} value={folha.id}>
                      {folha.competencia} · {tiposFolhaLabels[folha.tipo] ?? folha.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rubrica</Label>
              <Select
                value={folhaItemForm.rubrica_id}
                onValueChange={(value) => {
                  const rubrica = rubricas.find((item: any) => item.id === value)
                  setFolhaItemForm({
                    ...folhaItemForm,
                    rubrica_id: value,
                    descricao: folhaItemForm.descricao || rubrica?.nome || '',
                  })
                }}
                disabled={!folhaSelecionada || isLoadingRubricas}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!folhaSelecionada ? 'Selecione uma folha primeiro' : 'Selecione a rubrica'} />
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Natureza</Label>
                <Input
                  value={selectedRubrica ? naturezaLabels[selectedRubrica.natureza] ?? selectedRubrica.natureza : ''}
                  disabled
                />
              </div>
              <div className="space-y-1">
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={folhaItemForm.valor === 0 ? '' : folhaItemForm.valor}
                  onChange={(e) =>
                    setFolhaItemForm({
                      ...folhaItemForm,
                      valor: e.target.value === '' ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                value={folhaItemForm.descricao}
                onChange={(e) => setFolhaItemForm({ ...folhaItemForm, descricao: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFolhaFuncionario(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateFolhaItem}
                disabled={
                  createFolhaItem.isPending ||
                  !folhaFuncionario ||
                  !folhaItemForm.folhaId ||
                  !folhaItemForm.rubrica_id ||
                  !folhaItemForm.valor
                }
              >
                Lançar item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Separator />

      <div className="w-full max-w-sm">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nome, matrícula, cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-3" align="end">
              <DropdownMenuLabel>Filtros avançados</DropdownMenuLabel>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Empresa</Label>
                  <Select value={empresaFilter || 'all'} onValueChange={(v) => setEmpresaFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {empresaOptions.map((item) => (
                        <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Cargo</Label>
                  <Select value={cargoFilter || 'all'} onValueChange={(v) => setCargoFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {cargoOptions.map((item) => (
                        <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={ativoFilter || 'all'} onValueChange={(v) => setAtivoFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Contrato</Label>
                  <Select value={contratoFilter || 'all'} onValueChange={(v) => setContratoFilter(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="CLT">CLT</SelectItem>
                      <SelectItem value="PJ">PJ</SelectItem>
                      <SelectItem value="ESTAGIO">Estágio</SelectItem>
                      <SelectItem value="TEMPORARIO">Temporário</SelectItem>
                      <SelectItem value="APRENDIZ">Aprendiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmpresaFilter('')
                    setCargoFilter('')
                    setAtivoFilter('')
                    setContratoFilter('')
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={funcionarios}
        totalItems={pagination.count ?? 0}
        pageSizeOptions={[50, 100, 200, 500, 1000]}
      />
    </div>
  )
}
