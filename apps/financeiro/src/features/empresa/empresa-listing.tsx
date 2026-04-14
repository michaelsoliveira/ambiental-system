'use client'

import { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

import { DataTable } from '@/components/ui/table/data-table'
import { Input } from '@/components/ui/input'
import { useEmpresas } from '@/hooks/use-empresas'

import { EmpresaButton } from './empresa-button'

export default function EmpresaListingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useEmpresas(slug!, { search, limit: 50 })

  const empresas = data?.empresas ?? []
  const total = data?.pagination?.count ?? 0

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'nome',
        header: 'Nome',
        cell: ({ row }) =>
          row.original?.pessoa?.juridica?.nome_fantasia ??
          row.original?.pessoa?.juridica?.razao_social ??
          row.original?.pessoa?.fisica?.nome ??
          '-',
      },
      {
        id: 'tipo',
        header: 'Tipo Pessoa',
        cell: ({ row }) => (row.original?.pessoa?.juridica ? 'Jurídica' : 'Física'),
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => <EmpresaButton empresaId={row.original.id} />,
      },
    ],
    [],
  )

  if (isLoading) return <div>Carregando...</div>

  return (
    <div className="space-y-4">
      <Input
        className="max-w-sm"
        placeholder="Buscar empresa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <DataTable columns={columns} data={empresas} totalItems={total} pageSizeOptions={[10, 20, 30, 50]} />
    </div>
  )
}
