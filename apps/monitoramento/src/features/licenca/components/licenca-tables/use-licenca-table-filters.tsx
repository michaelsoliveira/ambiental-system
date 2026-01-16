'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export function useLicencaTableFilters() {
  const [search, setSearch] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [dataInicio, setDataInicio] = useQueryState(
    'dataInicio',
    searchParams.dataInicio
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [dataFim, setDataFim] = useQueryState(
    'dataFim',
    searchParams.dataFim
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [tipoLicenca, setTipoLicenca] = useQueryState(
    'tipoLicenca',
    searchParams.tipoLicenca.withOptions({ shallow: false }).withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const resetFilters = useCallback(() => {
    setDataInicio(null);
    setDataFim(null);
    setTipoLicenca(null)
    setSearch(null);
    setPage(1);
  }, [setDataInicio, setDataFim, setPage, setTipoLicenca, setSearch]);

  const isAnyFilterActive = useMemo(() => {
    return !!dataInicio || !!dataFim || !!tipoLicenca || !!search;
  }, [search, dataInicio, dataFim, tipoLicenca]);

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
    tipoLicenca, 
    setTipoLicenca
  };
}
