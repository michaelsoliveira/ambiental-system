'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getVeiculo } from '@/http/frota/get-veiculo'
import { getVeiculos } from '@/http/frota/get-veiculos'

type VeiculoOption = {
  label: string
  value: string
}

const PAGE_LIMIT = 50

function veiculoLabel(v: { placa: string; marca: string; modelo: string }) {
  return `${v.placa} · ${v.marca} ${v.modelo}`
}

export function useVeiculoSelect(org: string, selectedId?: string | null) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [accumulated, setAccumulated] = useState<VeiculoOption[]>([])
  const [pinnedOption, setPinnedOption] = useState<VeiculoOption | null>(null)
  const fetchedSelectedRef = useRef<string | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['veiculos-select', org, search, page],
    queryFn: () =>
      getVeiculos(org, {
        search: search.trim() || undefined,
        ativo: true,
        page,
        limit: PAGE_LIMIT,
      }),
    enabled: !!org,
  })

  useEffect(() => {
    const list = (data?.veiculos ?? []).map((v) => ({
      label: veiculoLabel(v),
      value: v.id,
    }))

    setAccumulated((prev) => {
      if (page === 1) {
        const prevIds = prev.map((p) => p.value).join(',')
        const nextIds = list.map((p) => p.value).join(',')
        if (prevIds === nextIds) return prev
        const selected = selectedId ? prev.find((p) => p.value === selectedId) : null
        if (selected && !list.some((p) => p.value === selectedId)) {
          return [selected, ...list]
        }
        return list
      }
      const seen = new Set(prev.map((p) => p.value))
      const next = list.filter((p) => !seen.has(p.value))
      if (next.length === 0) return prev
      return [...prev, ...next]
    })
  }, [data?.veiculos, page, selectedId])

  useEffect(() => {
    if (!selectedId || !org) return

    if (fetchedSelectedRef.current && fetchedSelectedRef.current !== selectedId) {
      fetchedSelectedRef.current = null
      setPinnedOption(null)
    }

    const inCurrentList = accumulated.some((v) => v.value === selectedId)
    if (inCurrentList) {
      setPinnedOption(null)
      fetchedSelectedRef.current = selectedId
      return
    }

    if (fetchedSelectedRef.current === selectedId) return

    let cancelled = false
    fetchedSelectedRef.current = selectedId

    void getVeiculo(org, selectedId)
      .then((veiculo) => {
        if (cancelled) return
        setPinnedOption({ label: veiculoLabel(veiculo), value: veiculo.id })
      })
      .catch(() => {
        if (!cancelled) fetchedSelectedRef.current = null
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, org, accumulated])

  useEffect(() => {
    if (!selectedId) {
      setPinnedOption(null)
      fetchedSelectedRef.current = null
    }
  }, [selectedId])

  const options = useMemo<VeiculoOption[]>(() => {
    if (pinnedOption && !accumulated.some((o) => o.value === pinnedOption.value)) {
      return [pinnedOption, ...accumulated]
    }
    return accumulated
  }, [accumulated, pinnedOption])

  const hasMore = (data?.total ?? 0) > page * PAGE_LIMIT

  const onSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
    setAccumulated([])
  }

  const onLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1)
    }
  }

  return {
    options,
    isLoading: isLoading && page === 1,
    isLoadingMore: isFetching && page > 1,
    hasMore,
    onSearchChange,
    onLoadMore,
  }
}
