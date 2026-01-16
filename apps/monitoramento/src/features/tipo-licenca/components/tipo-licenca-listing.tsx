'use client'

import { DataTable as DataTableTiposLicenca } from "@/components/ui/table/data-table";
import { columns } from "./tipo-licenca-table/columns";
import { useTiposLicenca } from "@/hooks/use-tipos-licenca";
import { useTipoLicencaTableFilters } from "./tipo-licenca-table/use-tipo-licenca-table-filters";

export function TipoLicencaListing() {
  const {
      search,
      page,
      limit
    } = useTipoLicencaTableFilters()
  
    const { data, isLoading } = useTiposLicenca({
      search,
      page,
      limit,
      orderBy: 'descricao',
      order: 'asc'
    })
    const { data: tiposLicenca = [], total } = data ?? { tiposLicenca: [], total: 0 }
  
  return (
    <>
      { data && (
        <>
          <DataTableTiposLicenca
              columns={columns}
              data={tiposLicenca}
              totalItems={total}
          />
        </>
      ) }
    </>
  );
}
