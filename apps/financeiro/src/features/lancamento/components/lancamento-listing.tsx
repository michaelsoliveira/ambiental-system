'use client'

import { DataTable as DataTableLancamentos } from "@/components/ui/table/data-table";
import { getColumns } from "./lancamento-tables/columns";
import { useLancamentos } from "@/hooks/use-lancamentos";
import { useLancamentoTableFilters } from "./lancamento-tables/use-lancamento-table-filters";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LancamentoSheet } from "./form/lancamento-sheet";
import { LancamentoFilters } from "./lancamento-filters";

interface LancamentoListingProps {
  categorias: any
  contas: any
  centrosCusto: any
  parceiros: any
  veiculos: Array<{ id: string; placa: string; modelo: string; marca: string }>
}

export function LancamentoListing({
  categorias,
  contas,
  centrosCusto,
  parceiros,
  veiculos,
}: LancamentoListingProps) {
  const {
    search,
    page,
    pageSize,
    tipoLancamento,
    statusLancamento,
    statusPagamento,
    filtrarPor,
    dataInicio,
    dataFim,
    categoriaId,
    contaBancariaId,
    centroCustoId,
    parceiroId,
    veiculoId,
    formaParcelamento,
    valorMin,
    valorMax,
    apenasVencidos,
    apenasAVencer
  } = useLancamentoTableFilters()

  const { slug } = useParams<{ slug: string }>()
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState(null);

  const pagoApi =
    statusPagamento === 'pago'
      ? 'true'
      : statusPagamento === 'nao_pago'
        ? 'false'
        : 'todos'

  const { data } = useLancamentos(slug, {
    search: search || undefined,
    page: page ?? 1,
    limit: pageSize ?? 10,
    tipo: tipoLancamento,
    status: statusLancamento,
    pago: pagoApi,
    filtrar_por: filtrarPor,
    data_inicio: dataInicio || undefined,
    data_fim: dataFim || undefined,
    categoria_id: categoriaId || undefined,
    conta_bancaria_id: contaBancariaId || undefined,
    centro_custo_id: centroCustoId || undefined,
    parceiro_id: parceiroId || undefined,
    veiculo_id: veiculoId || undefined,
    forma_parcelamento: formaParcelamento,
    valor_min: valorMin || undefined,
    valor_max: valorMax || undefined,
    apenas_vencidos: apenasVencidos,
    apenas_a_vencer: apenasAVencer,
    orderBy: 'data',
    order: 'desc',
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
        veiculos={veiculos}
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