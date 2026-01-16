'use client'

import { useAnoStore } from '@/stores/useAnoStore'
import useClient from './use-client'

export function useAnoController() {
  const { setAnoAtivo, resetAnoAtivo } = useAnoStore()
  const client = useClient()

  const atualizarAnoAtivo = async (ano: string) => {
    try {
      localStorage.setItem('ano_ativo', ano)
      await client.put('/parametro/ano_ativo', { valor: ano })
      setAnoAtivo(ano)
    } catch (error) {
      console.error('Erro ao atualizar ano:', error)
    }
  }

  const buscarAnoAtivo = async () => {
    try {
      const {
        data: { parametros }
      } = await client.get('/parametro?search=ano_ativo')

      const ano = parametros[0]?.valor || new Date().getFullYear().toString()
      localStorage.setItem('ano_ativo', ano)
      setAnoAtivo(ano)
    } catch (error) {
      console.error('Erro ao buscar ano ativo:', error)
    }
  }

  return {
    atualizarAnoAtivo,
    buscarAnoAtivo,
    resetAnoAtivo,
  }
}
