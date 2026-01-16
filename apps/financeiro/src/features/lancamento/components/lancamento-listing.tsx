'use client'

import { DataTable as DataTableLancamentos } from "@/components/ui/table/data-table";
import { getColumns } from "./lancamento-tables/columns";
import { useLancamentos } from "@/hooks/use-lancamentos";
import { useLancamentoTableFilters } from "./lancamento-tables/use-lancamento-table-filters";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LancamentoSheet } from "./form/lancamento-sheet";
import { LancamentoFilters } from "./lancamento-filters";

interface LancamentoListingProps {
  categorias: any
  contas: any
  centrosCusto: any
  parceiros: any
}

export function LancamentoListing({
  categorias,
  contas,
  centrosCusto,
  parceiros
}: LancamentoListingProps) {
  const {
    search,
    page,
    tipoLancamento,
    statusLancamento,
    statusPagamento,
    dataInicio,
    dataFim,
    categoriaId,
    contaBancariaId,
    centroCustoId,
    parceiroId,
    formaParcelamento,
    valorMin,
    valorMax,
    apenasVencidos,
    apenasAVencer
  } = useLancamentoTableFilters()

  const params = useSearchParams(); 
  const { slug } = useParams<{ slug: string }>()
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState(null);
  
  const { data, isLoading } = useLancamentos(slug, {
    search,
    page: page ?? 1,
    tipo: tipoLancamento,
    statusLan: statusLancamento,
    statusPagamento,
    dataInicio,
    dataFim,
    categoriaId,
    contaBancariaId,
    centroCustoId,
    parceiroId,
    formaParcelamento,
    valorMin,
    valorMax,
    apenasVencidos,
    apenasAVencer,
    limit: params.get('limit') ? Number(params.get('limit')) : 10,
    orderBy: 'data',
    order: 'desc'
  })
  
  const { lancamentos = [], pagination } = data ?? { lancamentos: [], count: 0 }
  
  const handleRowClick = (lancamento: any) => {
    setSelectedLancamento(lancamento);
    setIsDialogOpen(true);
  };

  const columns = getColumns(handleRowClick);
  
  return (
    <>
      <LancamentoFilters 
        categorias={categorias}
        contasBancarias={contas}
        centrosCusto={centrosCusto}
        parceiros={parceiros}
      />
      <DataTableLancamentos
          columns={columns}
          data={lancamentos}
          totalItems={pagination?.total ?? 0}
      />
      {selectedLancamento && (
        <LancamentoSheet
          className="md:max-w-3xl overflow-y-auto"
          initialData={selectedLancamento}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          categorias={categorias}
          contas={contas}
          centrosCusto={centrosCusto}
          parceiros={parceiros}
        />
      )}
    </>
  );
}