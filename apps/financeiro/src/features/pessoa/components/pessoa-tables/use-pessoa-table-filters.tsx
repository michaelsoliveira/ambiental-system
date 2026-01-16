'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export function usePessoaTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
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
    'limit',
    searchParams.limit.withDefault(50)
  )

  const [orderBy, setOrderBy] = useQueryState(
    'order_by',
    searchParams.orderBy.withDefault('created_at')
  );

  const [order, setOrder] = useQueryState(
    'order',
    searchParams.order.withDefault('desc')
  );

  const [tipo, setTipo] = useQueryState(
    'tipo',
    searchParams.tipo.withDefault('')
  );

  const [cidade, setCidade] = useQueryState(
    'cidade',
    searchParams.cidade.withDefault('')
  );

  const [estado, setEstado] = useQueryState(
    'estado',
    searchParams.estado.withDefault('')
  );

  const [hasEmail, setHasEmail] = useQueryState(
    'has_email',
    searchParams.has_email.withDefault('')
  );

  const [hasPhone, setHasPhone] = useQueryState(
    'has_phone',
    searchParams.has_phone.withDefault('')
  );

  const [createdAfter, setCreatedAfter] = useQueryState(
    'created_after',
    searchParams.created_after.withDefault('')
  );

  const [createdBefore, setCreatedBefore] = useQueryState(
    'created_before',
    searchParams.created_before.withDefault('')
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setCidade(null);
    setEstado(null);
    setTipo(null);
    setHasEmail(null);
    setHasPhone(null);
    setCreatedAfter(null);
    setCreatedBefore(null);
    setOrderBy('created_at');
    setOrder('desc');
    setPage(1); 
  }, [setSearchQuery, setPage, setCidade, setEstado, setTipo, setHasEmail, setHasPhone, setCreatedAfter, setCreatedBefore, setOrderBy, setOrder]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!tipo || !!cidade || !!estado || !!hasEmail || !!hasPhone || !!createdAfter || !!createdBefore;
  }, [searchQuery, tipo, cidade, estado, hasEmail, hasPhone, createdAfter, createdBefore]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    limit,
    setLimit,
    cidade,
    setCidade,
    estado,
    setEstado,
    tipo,
    setTipo,
    hasEmail,
    setHasEmail,
    hasPhone,
    setHasPhone,
    createdAfter,
    setCreatedAfter,
    createdBefore,
    setCreatedBefore,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    resetFilters,
    isAnyFilterActive
  };
}
