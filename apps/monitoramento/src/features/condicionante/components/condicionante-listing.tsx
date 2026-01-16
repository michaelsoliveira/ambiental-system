'use client'

import { DataTable as DataTableCondicionantes } from "@/components/ui/table/data-table";
import { columns } from "./condicionante-tables/columns";
import { useCondicionantes } from "@/hooks/use-condicionantes";
import { useState } from "react";
import { useCondicionanteTableFilters } from "./condicionante-tables/use-condicionante-table-filters";
import { useSearchParams } from "next/navigation";

export function CondicionanteListing() {
  const {
    search,
    page,
  } = useCondicionanteTableFilters()

  const params = useSearchParams(); 
  const { data, isLoading } = useCondicionantes({
    search,
    page: page ?? 1,
    limit: params.get('limit') ? Number(params.get('limit')) : 10,
    orderBy: 'descricao',
    order: 'asc'
  })
  const { data: condicionantes = [], total } = data ?? { condicionantes: [], total: 0 }
  return (
    <>
      { data && (
        <DataTableCondicionantes
            columns={columns}
            data={condicionantes}
            totalItems={total}
        />
      ) }
    </>
  );
}
