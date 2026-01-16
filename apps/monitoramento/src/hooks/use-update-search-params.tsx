'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from './use-debounce' // importando o hook de debounce

export function useUpdateSearchParams() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Função para atualizar os parâmetros da URL
  const setParams = (newParams: Record<string, string | undefined | null>, options?: Options | undefined) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reinicia a página para 1 ao trocar filtros
    // params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  // Função debounced para ser usada quando houver mudança de filtros (apenas em campos com digitação)
  // const debouncedSetParams = (newParams: Record<string, string | undefined | null>, delay: number) => {
  //   Object.entries(newParams).forEach(([key, value]) => {
  //     const debouncedValue = useDebounce(value || '', delay)
  //     if (debouncedValue) {
  //       setParams({ [key]: debouncedValue })
  //     }
  //   })
  // }

  return { setParams }
}
