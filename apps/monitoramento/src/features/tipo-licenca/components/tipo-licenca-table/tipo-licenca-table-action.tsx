'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import {
  useTipoLicencaTableFilters
} from './use-tipo-licenca-table-filters';

export default function TipoLicencaTableAction() {
  const {
    isAnyFilterActive,
    resetFilters,
    search,
    setPage,
    setSearch
  } = useTipoLicencaTableFilters();
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
