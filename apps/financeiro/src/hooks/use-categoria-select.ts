'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { getCategorias } from '@/http/categoria/get-categorias'
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

/**
 * Hook para o select de categorias com:
 * - Busca server-side (search)
 * - Pre-população automática ao editar (selectedId)
 */
export function useCategoriaSelect(
  org: string,
  selectedId?: string | null,
) {
  const [search, setSearch] = useState('')

  // Fetch filtrado por search (sem limite — categorias são master data finito)
  const { data, isLoading, isFetching } = useCategorias(org, {
    search: search.trim() || undefined,
    orderBy: 'codigo',
    order: 'asc',
    ativo: true,
  })

  // Categoria selecionada (para pré-popular no edit)
  const [selectedOption, setSelectedOption] = useState<CategoriaOption | null>(null)
  const fetchedSelectedRef = useRef<string | null>(null)

  // Garante que a categoria selecionada aparece na lista mesmo se estiver fora da busca atual
  useEffect(() => {
    if (!selectedId || !org) return
    if (fetchedSelectedRef.current === selectedId) return

    // Verifica se já está nos resultados atuais
    const inCurrentList = data?.categorias?.some((c: RawCategoria) => c.id === selectedId)
    if (inCurrentList) {
      const found = data!.categorias.find((c: RawCategoria) => c.id === selectedId)!
      setSelectedOption({ label: found.nome, value: found.id })
      fetchedSelectedRef.current = selectedId
      return
    }

    // Busca individualmente (sem filtro de search) para garantir pré-população
    fetchedSelectedRef.current = selectedId
    getCategorias(org, { orderBy: 'codigo', order: 'asc' })
      .then(({ categorias }) => {
        const found = categorias.find((c) => c.id === selectedId)
        if (found) {
          setSelectedOption({ label: found.nome, value: found.id })
        }
      })
      .catch(() => {})
  }, [selectedId, org, data?.categorias])

  // Limpa selected quando selectedId é removido
  useEffect(() => {
    if (!selectedId) {
      setSelectedOption(null)
      fetchedSelectedRef.current = null
    }
  }, [selectedId])

  const options = useMemo<CategoriaOption[]>(() => {
    const list: CategoriaOption[] = (data?.categorias ?? []).map((c: RawCategoria) => ({
      label: c.nome,
      value: c.id,
    }))

    // Garante que a opção selecionada aparece no topo da lista (para pré-popular no edit)
    if (selectedOption && !list.some((o) => o.value === selectedOption.value)) {
      return [selectedOption, ...list]
    }

    return list
  }, [data?.categorias, selectedOption])

  const onSearchChange = (value: string) => {
    setSearch(value)
  }

  return {
    options,
    isLoading: isLoading && !data,
    isFetching,
    onSearchChange,
  }
}
