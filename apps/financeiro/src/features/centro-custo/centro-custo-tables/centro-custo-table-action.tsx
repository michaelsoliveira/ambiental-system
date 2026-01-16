'use client';

import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import {
  useCentroCustoTableFilters
} from './use-centro-custo-table-filters';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' }
];

export default function CentroCustoTableAction() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    resetFilters,
    isAnyFilterActive,
    ativo,
    setAtivo
  } = useCentroCustoTableFilters();
  
  const handleSetAtivo = (
    value: string | ((old: string) => string | null) | null
  ) => {
    if (typeof value === 'function') {
      return setAtivo((old: string | null) => value(old ?? ''));
    }
    return setAtivo(value);
  };
  
  return (
    <div className='flex flex-row items-center gap-4'>
      <div className=''>
        <DataTableSearch
          searchKey='por nome, código ou descrição'
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          className='transition-all duration-300 ease-in-out w-72 focus:w-md'
        />
      </div>
      <DataTableFilterBox
        filterKey='ativo'
        title='Status'
        options={STATUS_OPTIONS}
        setFilterValue={handleSetAtivo}
        filterValue={ativo || ''}
      />
      <DataTableResetFilter
        isFilterActive={isAnyFilterActive}
        onReset={resetFilters}
      />
    </div>
  );
}
