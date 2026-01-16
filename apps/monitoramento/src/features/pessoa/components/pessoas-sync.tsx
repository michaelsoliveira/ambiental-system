'use client'

import { usePessoas } from '@/hooks/use-pessoas'
import { usePessoasStore } from '@/stores/usePessoasStore'
import { useEffect } from 'react'

export function EmpresasSync() {
  const { data, isLoading, error } = usePessoas({})
  const setPessoas = usePessoasStore((s) => s.setPessoas)

  useEffect(() => {
    if (data) {
      setPessoas(data)
    }
  }, [data, setPessoas])

  if (isLoading) return <p>Carregando pessoas...</p>
  if (error) return <p>Erro ao carregar pessoas</p>
  return null
}
