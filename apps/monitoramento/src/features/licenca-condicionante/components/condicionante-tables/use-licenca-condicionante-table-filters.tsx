'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export function useLicencaCondicionanteTableFilters() {
  const [search, setSearch] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: true, throttleMs: 500 })
      .withDefault('')
  );

  const [dataInicio, setDataInicio] = useQueryState(
    'dataInicio',
    searchParams.dataInicio
      .withOptions({ shallow: true, throttleMs: 500 })
      .withDefault('')
  );

  const [dataFim, setDataFim] = useQueryState(
    'dataFim',
    searchParams.dataFim
      .withOptions({ shallow: true, throttleMs: 500 })
      .withDefault('')
  );

  const [condicionante, setCondicionante] = useQueryState(
    'condicionante',
    searchParams.condicionante.withOptions({ shallow: false }).withDefault('')
  );

  const [status, setStatus] = useQueryState(
    'status',
    searchParams.status.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const resetFilters = useCallback(() => {
    setDataInicio(null);
    setDataFim(null);
    setCondicionante(null)
    setSearch(null);
    setStatus(null);
    setPage(1);
  }, [setDataInicio, setDataFim, setPage, setCondicionante, setSearch, setStatus]);

  const isAnyFilterActive = useMemo(() => {
    return !!dataInicio || !!dataFim || !!condicionante || !!search || !!status;
  }, [status, search, dataInicio, dataFim, condicionante]);

  return {
    dataInicio,
    dataFim,
    setDataInicio,
    setDataFim,
    page,
    setPage,
    search,
    setSearch,
    resetFilters,
    isAnyFilterActive,
    condicionante, 
    setCondicionante,
    status,
    setStatus
  };
}
