'use client';

import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import {
  useContaTableFilters
} from './use-conta-table-filters';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' }
];

const TIPO_OPTIONS = [
  { value: 'BANCARIA', label: 'Bancária' },
  { value: 'CONTABIL', label: 'Contábil' }
];

export default function ContaTableAction() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    resetFilters,
    isAnyFilterActive,
    ativo,
    setAtivo,
    tipo,
    setTipo
  } = useContaTableFilters();

  const handleSetAtivo = (
    value: string | ((old: string) => string | null) | null
  ) => {
    if (typeof value === 'function') {
      return setAtivo((old: string | null) => value(old ?? ''));
    }
    return setAtivo(value);
  };

  const handleSetTipo = (
    value: string | ((old: string) => string | null) | null
  ) => {
    if (typeof value === 'function') {
      return setTipo((old: string | null) => value(old ?? ''));
    }
    return setTipo(value);
  };
  
  return (
    <div className='flex flex-row items-center gap-4'>
      <div className=''>
        <DataTableSearch
          searchKey='por nome, banco ou agência'
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          className='transition-all duration-300 ease-in-out w-72 focus:w-md'
        />
      </div>
      <DataTableFilterBox
        filterKey='tipo'
        title='Tipo'
        options={TIPO_OPTIONS}
        setFilterValue={handleSetTipo}
        filterValue={tipo || ''}
      />
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
