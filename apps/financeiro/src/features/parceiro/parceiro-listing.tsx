'use client'

import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box'
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter'
import { DataTableSearch } from '@/components/ui/table/data-table-search'
import { useParceiros } from '@/hooks/use-parceiros'

import { ParceiroListingClient } from './parceiro-listing-client'
import { useParceiroTableFilters } from './use-parceiro-table-filters'

const STATUS_OPTIONS = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
]

const TIPO_OPTIONS = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'FORNECEDOR', label: 'Fornecedor' },
  { value: 'AMBOS', label: 'Ambos' },
]

export function ParceiroListing({
  orgSlug,
  canUpdate,
  canDelete,
}: {
  orgSlug: string
  canUpdate: boolean
  canDelete: boolean
}) {
  const {
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    ativo,
    setAtivo,
    tipoParceiro,
    setTipoParceiro,
    resetFilters,
    isAnyFilterActive,
  } = useParceiroTableFilters()

  const { data, isLoading, error } = useParceiros(orgSlug, {
    search: search || undefined,
    page,
    limit,
    ativo: ativo ? ativo === 'true' : undefined,
    tipo_parceiro: (tipoParceiro || undefined) as 'CLIENTE' | 'FORNECEDOR' | 'AMBOS' | undefined,
    orderBy: 'created_at',
    order: 'desc',
  })

  const parceiros = data?.parceiros ?? []
  const pagination = data?.pagination ?? { count: 0, page: 1, limit: 10, total_pages: 1 }

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center gap-4">
        <DataTableSearch
          searchKey="por nome, documento ou observações"
          searchQuery={search}
          setSearchQuery={setSearch}
          setPage={setPage}
          className="transition-all duration-300 ease-in-out w-72 focus:w-md"
        />
        <DataTableFilterBox
          filterKey="tipo_parceiro"
          title="Tipo"
          options={TIPO_OPTIONS}
          setFilterValue={setTipoParceiro as any}
          filterValue={tipoParceiro || ''}
        />
        <DataTableFilterBox
          filterKey="ativo"
          title="Status"
          options={STATUS_OPTIONS}
          setFilterValue={setAtivo as any}
          filterValue={ativo || ''}
        />
        <DataTableResetFilter isFilterActive={isAnyFilterActive} onReset={resetFilters} />
      </div>
    {
      isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : error ? (
        <div className="text-destructive">Erro ao carregar parceiros</div>
      ) : (
        <ParceiroListingClient
          parceiros={parceiros}
          canUpdate={canUpdate}
          canDelete={canDelete}
          page={pagination.page}
          totalPages={pagination.total_pages}
          totalItems={pagination.count}
          pageSize={pagination.limit}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
        />
      )
    }
    </div>
  )
}
