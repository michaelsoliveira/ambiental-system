'use client'

import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useMemo } from 'react'

export function useParceiroTableFilters() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [limit, setLimit] = useQueryState('limit', parseAsInteger.withDefault(50))
  const [ativo, setAtivo] = useQueryState('ativo', parseAsString.withDefault(''))
  const [tipoParceiro, setTipoParceiro] = useQueryState(
    'tipo_parceiro',
    parseAsString.withDefault(''),
  )

  const isAnyFilterActive = useMemo(() => !!search || !!ativo || !!tipoParceiro, [search, ativo, tipoParceiro])

  const resetFilters = () => {
    setSearch(null)
    setAtivo(null)
    setTipoParceiro(null)
    setPage(1)
  }

  return {
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    ativo,
    setAtivo,
    tipoParceiro,
    setTipoParceiro,
    isAnyFilterActive,
    resetFilters,
  }
}
