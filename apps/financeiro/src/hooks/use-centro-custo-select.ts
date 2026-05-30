'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { getCentroCusto } from '@/http/centro-custo/get-centro-custo'
import { getCentrosCusto } from '@/http/centro-custo/get-centros-custo'
import { useQuery } from '@tanstack/react-query'

type CentroCustoOption = {
  label: string
  value: string
}

type RawCentroCusto = {
  id: string
  codigo: string
  nome: string
  ativo: boolean
}

const PAGE_LIMIT = 50

/**
 * Select de centros de custo com busca server-side.
 * Se o item selecionado não estiver na página atual, busca por ID e
 * insere no topo da lista (funciona para qualquer posição, ex.: registro 501+).
 */
export function useCentroCustoSelect(
  org: string,
  selectedId?: string | null,
) {
  const [search, setSearch] = useState('')
  const [pinnedOption, setPinnedOption] = useState<CentroCustoOption | null>(null)
  const fetchedSelectedRef = useRef<string | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['centros-custo-select', org, search],
    queryFn: () =>
      getCentrosCusto(org, {
        search: search.trim() || undefined,
        orderBy: 'codigo',
        order: 'asc',
        limit: PAGE_LIMIT,
      }),
    enabled: !!org,
  })

  useEffect(() => {
    if (!selectedId || !org) return

    if (fetchedSelectedRef.current && fetchedSelectedRef.current !== selectedId) {
      fetchedSelectedRef.current = null
      setPinnedOption(null)
    }

    const inCurrentList = data?.centros?.some((c: RawCentroCusto) => c.id === selectedId)
    if (inCurrentList) {
      setPinnedOption(null)
      fetchedSelectedRef.current = selectedId
      return
    }

    if (fetchedSelectedRef.current === selectedId) return

    let cancelled = false
    fetchedSelectedRef.current = selectedId

    void getCentroCusto(org, selectedId)
      .then(({ centroCusto }) => {
        if (cancelled) return
        setPinnedOption({ label: centroCusto.nome, value: centroCusto.id })
      })
      .catch(() => {
        if (!cancelled) fetchedSelectedRef.current = null
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, org, data?.centros])

  useEffect(() => {
    if (!selectedId) {
      setPinnedOption(null)
      fetchedSelectedRef.current = null
    }
  }, [selectedId])

  const options = useMemo<CentroCustoOption[]>(() => {
    const list: CentroCustoOption[] = (data?.centros ?? []).map((c: RawCentroCusto) => ({
      label: c.nome,
      value: c.id,
    }))

    if (pinnedOption && !list.some((o) => o.value === pinnedOption.value)) {
      return [pinnedOption, ...list]
    }

    return list
  }, [data?.centros, pinnedOption])

  return {
    options,
    isLoading: isLoading && !data,
    isFetching,
    onSearchChange: setSearch,
  }
}
