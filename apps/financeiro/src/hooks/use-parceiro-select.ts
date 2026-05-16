'use client'

import { useEffect, useMemo, useState } from 'react'

import { getParceiro } from '@/http/parceiro/get-parceiro'
import type { ParceiroListRecord } from '@/http/parceiro/get-parceiros'
import { useParceiros } from '@/hooks/use-parceiros'
import { getParceiroDisplayName } from '@/lib/parceiro-display-name'

export function useParceiroSelect(org: string, selectedId?: string | null) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [accumulated, setAccumulated] = useState<ParceiroListRecord[]>([])

  const { data, isLoading, isFetching } = useParceiros(org, {
    search: search.trim() || undefined,
    page,
    limit: 50,
    ativo: true,
    order: 'asc',
    orderBy: 'created_at',
  })

  useEffect(() => {
    const list = data?.parceiros ?? []
    setAccumulated((prev) => {
      if (page === 1) {
        const prevIds = prev.map((p) => p.id).join(',')
        const nextIds = list.map((p) => p.id).join(',')
        if (prevIds === nextIds) return prev
        return list
      }
      const seen = new Set(prev.map((p) => p.id))
      const next = list.filter((p) => !seen.has(p.id))
      if (next.length === 0) return prev
      return [...prev, ...next]
    })
  }, [data?.parceiros, page])

  useEffect(() => {
    if (!selectedId || !org) return

    let cancelled = false
    void getParceiro(org, selectedId)
      .then(({ parceiro }) => {
        if (cancelled) return
        setAccumulated((prev) => {
          if (prev.some((p) => p.id === parceiro.id)) return prev
          return [
            {
              id: parceiro.id,
              tipo_parceiro: '',
              observacoes: parceiro.observacoes,
              ativo: parceiro.ativo,
              created_at: parceiro.created_at,
              updated_at: parceiro.updated_at,
              pessoa: parceiro.pessoa,
            } as ParceiroListRecord,
            ...prev,
          ]
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [selectedId, org])

  const options = useMemo(
    () =>
      accumulated.map((p) => ({
        label: getParceiroDisplayName(p),
        value: p.id,
      })),
    [accumulated],
  )

  const onSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
    setAccumulated([])
  }

  const onLoadMore = () => {
    if (data?.pagination?.has_next && !isFetching) {
      setPage((p) => p + 1)
    }
  }

  return {
    options,
    isLoading: isLoading && page === 1,
    isLoadingMore: isFetching && page > 1,
    hasMore: data?.pagination?.has_next ?? false,
    onSearchChange,
    onLoadMore,
  }
}
