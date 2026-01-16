'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import {
  useLicencaTableFilters
} from './use-licenca-table-filters';
import { LicencaDataTableSearch } from './licenca-data-table-search';
import { useTiposLicenca } from '@/hooks/use-tipos-licenca';

export default function LicencaTableAction() {
  const {
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    tipoLicenca,
    setTipoLicenca,
    setPage,
    resetFilters,
    isAnyFilterActive,
    search,
    setSearch
  } = useLicencaTableFilters();

  const { data: dataTipos = [] } = useTiposLicenca({ orderBy: 'descricao' })
  const { data, error, total } = dataTipos
  return (
    <div className='flex flex-wrap items-center gap-4 mt-4'>
      { data && (
        <>
          <LicencaDataTableSearch
            search={search}
            setSearch={setSearch}
            dataInicio={dataInicio}
            setDataInicio={setDataInicio}
            tiposLicenca={data}
            dataFim={dataFim}
            setDataFim={setDataFim}
            tipoLicenca={tipoLicenca}
            setTipoLicenca={setTipoLicenca}
            setPage={setPage}
          >
            <DataTableResetFilter
              isFilterActive={isAnyFilterActive}
              onReset={resetFilters}
            />
          </LicencaDataTableSearch>
        </>
      ) }
    </div>
  );
}
