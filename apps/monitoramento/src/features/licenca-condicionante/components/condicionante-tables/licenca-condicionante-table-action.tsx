'use client';

import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import {
  useLicencaCondicionanteTableFilters
} from './use-licenca-condicionante-table-filters';
import { LicencaCondicionanteDataTableSearch } from './licenca-condicionante-data-table-search';
import { useCondicionantes } from '@/hooks/use-condicionantes';

export default function LicencaCondicionanteTableAction() {
  const {
      dataInicio,
      dataFim,
      condicionante,
      status,        
      setPage,
      setDataInicio,
      setDataFim,
      setStatus,
      setCondicionante,
      resetFilters,
      isAnyFilterActive
  } = useLicencaCondicionanteTableFilters()

  const { data = [] } = useCondicionantes({ orderBy: 'descricao' });
  const { data: condicionantes = [] } = data

  return (
    <>
      {data && (
        <div className='flex flex-wrap items-center gap-4'>
          <LicencaCondicionanteDataTableSearch 
              dataInicio={dataInicio}
              dataFim={dataFim}
              setDataInicio={setDataInicio}
              setDataFim={setDataFim}
              condicionante={condicionante}
              status={status}
              setStatus={setStatus}
              condicionantes={condicionantes}
              setPage={setPage}
              setCondicionante={setCondicionante}
          >
              <DataTableResetFilter
                  isFilterActive={isAnyFilterActive}
                  onReset={resetFilters}
              />
          </LicencaCondicionanteDataTableSearch>
        </div>
      )}
    </>
  );
}
