import { parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useMemo } from 'react';

export function useLancamentoTableFilters() {
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withOptions({ shallow: false }).withDefault(1)
  );

  const [pageSize, setPageSize] = useQueryState(
    'limit',
    parseAsInteger
      .withOptions({ shallow: false, history: 'push' })
      .withDefault(50)
  );

  // Filtro de tipo de lançamento (RECEITA, DESPESA, TRANSFERENCIA)
  const [tipoLancamento, setTipoLancamento] = useQueryState(
    'tipo',
    parseAsString.withOptions({ shallow: false }).withDefault('todos')
  );

  // Filtro de status do lançamento
  const [statusLancamento, setStatusLancamento] = useQueryState(
    'status',
    parseAsString.withOptions({ shallow: false }).withDefault('todos')
  );

  // Filtro de status de pagamento
  const [statusPagamento, setStatusPagamento] = useQueryState(
    'pago',
    parseAsString.withOptions({ shallow: false }).withDefault('todos')
  );

  // Filtros de data
  const [filtrarPor, setFiltrarPor] = useQueryState(
    'filtrar_por',
    parseAsString.withOptions({ shallow: false }).withDefault('data')
  );

  const [dataInicio, setDataInicio] = useQueryState(
    'data_inicio',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  const [dataFim, setDataFim] = useQueryState(
    'data_fim',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro de categoria financeira
  const [categoriaId, setCategoriaId] = useQueryState(
    'categoria_id',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro de conta bancária
  const [contaBancariaId, setContaBancariaId] = useQueryState(
    'conta_bancaria_id',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro de centro de custo
  const [centroCustoId, setCentroCustoId] = useQueryState(
    'centro_custo_id',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro de parceiro
  const [parceiroId, setParceiroId] = useQueryState(
    'parceiro_id',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro de veículo (frota)
  const [veiculoId, setVeiculoId] = useQueryState(
    'veiculo_id',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro de forma de parcelamento
  const [formaParcelamento, setFormaParcelamento] = useQueryState(
    'forma_parcelamento',
    parseAsString.withOptions({ shallow: false }).withDefault('todos')
  );

  // Filtros de valor
  const [valorMin, setValorMin] = useQueryState(
    'valor_min',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  const [valorMax, setValorMax] = useQueryState(
    'valor_max',
    parseAsString.withOptions({ shallow: false }).withDefault('')
  );

  // Filtro para mostrar apenas vencidos
  const [apenasVencidos, setApenasVencidos] = useQueryState(
    'apenas_vencidos',
    parseAsBoolean.withOptions({ shallow: false }).withDefault(false)
  );

  // Filtro para mostrar apenas a vencer
  const [apenasAVencer, setApenasAVencer] = useQueryState(
    'apenas_a_vencer',
    parseAsBoolean.withOptions({ shallow: false }).withDefault(false)
  );

  const isAnyFilterActive = useMemo(() => {
    return (
      !!search ||
      (tipoLancamento && tipoLancamento !== 'todos') ||
      (statusLancamento && statusLancamento !== 'todos') ||
      (statusPagamento && statusPagamento !== 'todos') ||
      !!dataInicio ||
      !!dataFim ||
      !!categoriaId ||
      !!contaBancariaId ||
      !!centroCustoId ||
      !!parceiroId ||
      !!veiculoId ||
      (formaParcelamento && formaParcelamento !== 'todos') ||
      !!valorMin ||
      !!valorMax ||
      apenasVencidos ||
      apenasAVencer
    );
  }, [
    search,
    tipoLancamento,
    statusLancamento,
    statusPagamento,
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
  ]);

  const resetFilters = () => {
    setSearch('');
    setTipoLancamento('todos');
    setStatusLancamento('todos');
    setStatusPagamento('todos');
    setFiltrarPor('data');
    setDataInicio('');
    setDataFim('');
    setCategoriaId('');
    setContaBancariaId('');
    setCentroCustoId('');
    setParceiroId('');
    setVeiculoId('');
    setFormaParcelamento('todos');
    setValorMin('');
    setValorMax('');
    setApenasVencidos(false);
    setApenasAVencer(false);
    setPage(1);
  };

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    tipoLancamento,
    setTipoLancamento,
    statusLancamento,
    setStatusLancamento,
    statusPagamento,
    setStatusPagamento,
    filtrarPor,
    setFiltrarPor,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    categoriaId,
    setCategoriaId,
    contaBancariaId,
    setContaBancariaId,
    centroCustoId,
    setCentroCustoId,
    parceiroId,
    setParceiroId,
    veiculoId,
    setVeiculoId,
    formaParcelamento,
    setFormaParcelamento,
    valorMin,
    setValorMin,
    valorMax,
    setValorMax,
    apenasVencidos,
    setApenasVencidos,
    apenasAVencer,
    setApenasAVencer,
    resetFilters,
    isAnyFilterActive
  };
}