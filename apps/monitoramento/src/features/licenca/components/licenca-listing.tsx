'use client'

import { LicencaDataTable } from './licenca-tables/licenca-data-table';
import { empresaColumns } from './licenca-tables/columns';
import { useLicencaTableFilters } from './licenca-tables/use-licenca-table-filters';
import { useLicencas } from '@/hooks/use-licencas';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useSearchParams } from 'next/navigation';

export default function LicencaListingPage() {
  const {
    search,
    dataInicio,
    dataFim,
    page,
    tipoLicenca, 
  } = useLicencaTableFilters()

  const params = useSearchParams(); 
  
  const { data, isLoading, error } = useLicencas({
    search,
    dataInicio,
    dataFim,
    page,
    tipoLicenca, 
    limit: Number(params.get('limit')),
    orderBy: 'juridica.nome_fantasia',
    order: 'asc'
  });

    return (
    <>
      { isLoading 
        ? (
          <DataTableSkeleton />
        ) : (
          <>
            <LicencaDataTable
                columns={empresaColumns}
                data={data.data}
                totalItems={data.total}
              />
          </>
      )}
    </>
    );
  

}

