'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import {
  useCondicionanteTableFilters
} from './use-condicionante-table-filters';

export default function CondicionanteTableAction() {
  const {
    isAnyFilterActive,
    resetFilters,
    search,
    setPage,
    setSearch
  } = useCondicionanteTableFilters();
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <DataTableSearch
        searchKey='descricao'
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
