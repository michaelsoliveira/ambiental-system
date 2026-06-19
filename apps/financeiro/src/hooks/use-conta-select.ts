'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getConta } from '@/http/conta/get-conta'
import { getContas } from '@/http/conta/get-contas'

type ContaOption = {
  label: string
  value: string
}

const PAGE_LIMIT = 50

export function useContaSelect(org: string, selectedId?: string | null) {
  const [search, setSearch] = useState('')
  const [pinnedOption, setPinnedOption] = useState<ContaOption | null>(null)
  const fetchedSelectedRef = useRef<string | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['contas-select', org, search],
    queryFn: () =>
      getContas(org, {
        search: search.trim() || undefined,
        ativo: true,
        orderBy: 'nome',
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

    const inCurrentList = data?.contas?.some((c) => c.id === selectedId)
    if (inCurrentList) {
      setPinnedOption(null)
      fetchedSelectedRef.current = selectedId
      return
    }

    if (fetchedSelectedRef.current === selectedId) return

    let cancelled = false
    fetchedSelectedRef.current = selectedId

    void getConta(org, selectedId)
      .then(({ conta }) => {
        if (cancelled) return
        setPinnedOption({ label: conta.nome, value: conta.id })
      })
      .catch(() => {
        if (!cancelled) fetchedSelectedRef.current = null
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, org, data?.contas])

  useEffect(() => {
    if (!selectedId) {
      setPinnedOption(null)
      fetchedSelectedRef.current = null
    }
  }, [selectedId])

  const options = useMemo<ContaOption[]>(() => {
    const list: ContaOption[] = (data?.contas ?? []).map((c) => ({
      label: c.nome,
      value: c.id,
    }))

    if (pinnedOption && !list.some((o) => o.value === pinnedOption.value)) {
      return [pinnedOption, ...list]
    }

    return list
  }, [data?.contas, pinnedOption])

  return {
    options,
    isLoading: isLoading && !data,
    isFetching,
    onSearchChange: setSearch,
  }
}
