'use client';

import { parseAsInteger, parseAsString,useQueryState } from 'nuqs';

export const useCentroCustoTableFilters = () => {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  );

  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );

  const [orderBy, setOrderBy] = useQueryState(
    'orderBy',
    parseAsString.withDefault('nome')
  );

  const [order, setOrder] = useQueryState(
    'order', 
    parseAsString.withDefault('asc')
  );

  const [ativo, setAtivo] = useQueryState(
    'ativo',
    parseAsString.withOptions({ clearOnDefault: true })
  );

  const resetFilters = () => {
    setSearchQuery('');
    setPage(1);
    setOrderBy('nome');
    setOrder('asc');
    setAtivo(null);
  };

  const isAnyFilterActive = Boolean(searchQuery || ativo);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    ativo,
    setAtivo
  };
};
