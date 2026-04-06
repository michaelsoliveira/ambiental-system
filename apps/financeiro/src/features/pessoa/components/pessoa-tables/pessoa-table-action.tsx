'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';

import {
  usePessoaTableFilters
} from './use-pessoa-table-filters';

export default function UnidadeTableAction() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    resetFilters,
    isAnyFilterActive
  } = usePessoaTableFilters();
  return (
    <div className='flex flex-row items-center gap-4'>
      <div className=''>
        <DataTableSearch
          searchKey='por nome, cpf ou email'
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          className='transition-all duration-300 ease-in-out w-72 focus:w-md'
        />
      </div>
      <DataTableResetFilter
        isFilterActive={isAnyFilterActive}
        onReset={resetFilters}
      />
    </div>
  );
}
