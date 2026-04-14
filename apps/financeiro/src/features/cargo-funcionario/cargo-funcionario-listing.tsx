'use client'

import { ColumnDef } from '@tanstack/react-table'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { DataTable } from '@/components/ui/table/data-table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCargosFuncionario } from '@/hooks/use-cargos-funcionario'

import { CargoFuncionarioButton } from './cargo-funcionario-button'

export default function CargoFuncionarioListingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useCargosFuncionario(slug!, { search, limit: 50 })

  const cargos = data?.cargos ?? []
  const total = data?.pagination?.count ?? 0

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: 'codigo', header: 'Código' },
      { accessorKey: 'nome', header: 'Nome' },
      {
        accessorKey: 'salario_base',
        header: 'Salário Base',
        cell: ({ row }) =>
          Number(row.original.salario_base).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }),
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => <CargoFuncionarioButton cargoId={row.original.id} />,
      },
    ],
    [],
  )

  if (isLoading) return <div>Carregando...</div>

  return (
    <div className="space-y-4">
      <div className="w-full max-w-sm">
        <Input
          placeholder="Buscar por nome ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={cargos}
        totalItems={total}
        pageSizeOptions={[10, 20, 30, 40, 50]}
      />
    </div>
  )
}
