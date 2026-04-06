'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';

import { useLancamentoTableFilters } from './use-lancamento-table-filters';

export default function LancamentoTableAction() {
  const {
    isAnyFilterActive,
    resetFilters,
    search,
    setPage,
    setSearch
  } = useLancamentoTableFilters();
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <label htmlFor="pesquisar" className='text-sm'>Pesquisar</label>

      <DataTableSearch
        searchKey='por descrição'
        searchQuery={search}
        setSearchQuery={setSearch}
        setPage={setPage}
      />
      <DataTableResetFilter
        isFilterActive={isAnyFilterActive}
        onReset={resetFilters}
      />
    </div>
  );
}
