'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import {
  useEmpresaTableFilters
} from './use-pessoa-table-filters';

export default function UnidadeTableAction() {
  const {
    isAnyFilterActive,
    resetFilters,
    search,
    setPage,
    setSearch
  } = useEmpresaTableFilters();
  return (
    <div className='flex flex-wrap items-center gap-4'>
      <DataTableSearch
        searchKey='nome'
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
