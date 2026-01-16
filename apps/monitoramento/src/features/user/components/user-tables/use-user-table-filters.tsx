'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export function useUserTableFilter() {
  const [search, setSearch] = useQueryState(
    'q',
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault('')
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1)
  );

  const [limit, setLimit] = useQueryState(
    'page',
    searchParams.limit.withDefault(10)
  );

  const resetFilters = useCallback(() => {
    setSearch(null);
    setPage(1);
  }, [setSearch, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!search;
  }, [search]);

  return {
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    resetFilters,
    isAnyFilterActive
  };
}
