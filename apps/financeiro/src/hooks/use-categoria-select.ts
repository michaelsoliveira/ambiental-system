'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { getCategoria } from '@/http/categoria/get-categoria'
import { useCategorias } from '@/hooks/use-categoria'

type CategoriaOption = {
  label: string
  value: string
}

type RawCategoria = {
  id: string
  codigo: string
  nome: string
  tipo: 'RECEITA' | 'DESPESA'
  ativo: boolean
  nivel: number
}

export type CategoriaSelectFilters = {
  tipo?: 'RECEITA' | 'DESPESA'
  ativo?: boolean
}

const PAGE_LIMIT = 100

function labelCategoria(c: { codigo?: string | null; nome: string }) {
  return c.codigo ? `${c.codigo} — ${c.nome}` : c.nome
}

/**
 * Select de categorias com busca server-side.
 * Se o item selecionado não estiver na página atual, busca por ID e
 * insere no topo da lista (funciona para qualquer posição, ex.: registro 501+).
 */
export function useCategoriaSelect(
  org: string,
  selectedId?: string | null,
  filters?: CategoriaSelectFilters,
) {
  const [search, setSearch] = useState('')
  const [pinnedOption, setPinnedOption] = useState<CategoriaOption | null>(null)
  const fetchedSelectedRef = useRef<string | null>(null)

  const { data, isLoading, isFetching } = useCategorias(org, {
    search: search.trim() || undefined,
    orderBy: 'codigo',
    order: 'asc',
    limit: PAGE_LIMIT,
    tipo: filters?.tipo,
    ativo: filters?.ativo,
  })

  useEffect(() => {
    if (!selectedId || !org) return

    if (fetchedSelectedRef.current && fetchedSelectedRef.current !== selectedId) {
      fetchedSelectedRef.current = null
      setPinnedOption(null)
    }

    const inCurrentList = data?.categorias?.some((c: RawCategoria) => c.id === selectedId)
    if (inCurrentList) {
      setPinnedOption(null)
      fetchedSelectedRef.current = selectedId
      return
    }

    if (fetchedSelectedRef.current === selectedId) return

    let cancelled = false
    fetchedSelectedRef.current = selectedId

    void getCategoria(org, selectedId)
      .then(({ categoria }) => {
        if (cancelled) return
        if (filters?.tipo && categoria.tipo !== filters.tipo) return
        if (filters?.ativo === true && !categoria.ativo) return
        setPinnedOption({
          label: labelCategoria(categoria),
          value: categoria.id,
        })
      })
      .catch(() => {
        if (!cancelled) fetchedSelectedRef.current = null
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, org, data?.categorias, filters?.tipo, filters?.ativo])

  useEffect(() => {
    if (!selectedId) {
      setPinnedOption(null)
      fetchedSelectedRef.current = null
    }
  }, [selectedId])

  const options = useMemo<CategoriaOption[]>(() => {
    const list: CategoriaOption[] = (data?.categorias ?? []).map((c: RawCategoria) => ({
      label: labelCategoria(c),
      value: c.id,
    }))

    if (pinnedOption && !list.some((o) => o.value === pinnedOption.value)) {
      return [pinnedOption, ...list]
    }

    return list
  }, [data?.categorias, pinnedOption])

  return {
    options,
    isLoading: isLoading && !data,
    isFetching,
    onSearchChange: setSearch,
  }
}
