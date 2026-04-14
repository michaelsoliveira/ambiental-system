'use client'

import { ColumnDef } from '@tanstack/react-table'
import { FilterIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { SelectSearchable } from '@/components/select-searchable'
import { DataTable } from '@/components/ui/table/data-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { useCreateFuncionario, useDeleteFuncionario, useFuncionarios } from '@/hooks/use-funcionarios'
import { usePessoas } from '@/hooks/use-pessoas'

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
  const [form, setForm] = useState<any>({
    pessoa_id: '',
    empresa_id: '',
    matricula: '',
    cargo_id: '',
    departamento: '',
  })
  const [cargoNome, setCargoNome] = useState('')
  const [cargoSalario, setCargoSalario] = useState(0)

  const { data } = useFuncionarios(slug, {
    search,
    empresa_id: empresaFilter || undefined,
    cargo_id: cargoFilter || undefined,
    ativo: ativoFilter ? ativoFilter === 'true' : undefined,
    tipo_contrato: contratoFilter || undefined,
  })
  const createFuncionario = useCreateFuncionario(slug)
  const deleteFuncionario = useDeleteFuncionario(slug)
  const createCargo = useCreateCargoFuncionario(slug)
  const { data: cargosData } = useCargosFuncionario(slug, { search: searchCargoForm, limit: 50 })
  const { data: empresasData } = useEmpresas(slug, { search: searchEmpresaForm, limit: 50 })
  const { data: pessoasData }: any = usePessoas(slug, { search: searchPessoaForm, limit: 50 })
  const funcionarios = data?.funcionarios ?? []
  const cargos = cargosData?.cargos ?? []
  const empresas = empresasData?.empresas ?? []
  const pessoas = pessoasData?.data ?? pessoasData?.pessoas ?? []
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteFuncionario.mutate(row.original.id)}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [deleteFuncionario],
  )

  async function handleCreate() {
    await createFuncionario.mutateAsync({
      ...form,
      ativo: true,
      tipo_contrato: form.tipo_contrato ?? 'CLT',
    })
    setOpen(false)
  }

  async function handleCreateCargo() {
    const result = await createCargo.mutateAsync({
      nome: cargoNome,
      salario_base: Number(cargoSalario),
      ativo: true,
    })
    setForm((prev: any) => ({ ...prev, cargo_id: result.id }))
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 p-6">
      <div className="flex items-start justify-between">
        <Heading
          title="Funcionários"
          description="Cadastro e gestão dos funcionários utilizados na folha."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full p-4 shadow-xl">
              <PlusIcon className="mr-2 h-5 w-5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo funcionário</DialogTitle>
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
                <Input onChange={(e) => setForm({ ...form, matricula: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Cargo</Label>
                <SelectSearchable
                  options={cargoOptions}
                  value={form.cargo_id}
                  onValueChange={(value) => setForm({ ...form, cargo_id: value })}
                  onSearchChange={setSearchCargoForm}
                  placeholder="Selecione um cargo"
                />
              </div>
              <div className="space-y-1">
                <Label>Departamento</Label>
                <Input onChange={(e) => setForm({ ...form, departamento: e.target.value })} />
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
                <Label>Novo cargo (nome)</Label>
                <Input value={cargoNome} onChange={(e) => setCargoNome(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Novo cargo (salário base)</Label>
                <Input type="number" value={cargoSalario} onChange={(e) => setCargoSalario(Number(e.target.value))} />
                <Button type="button" variant="outline" className="mt-2" onClick={handleCreateCargo}>
                  Criar cargo e vincular
                </Button>
              </div>
              <Button className="w-full" onClick={handleCreate}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
