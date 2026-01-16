'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useClient from './use-client'

export interface VencimentoCondicionantePayload {
  vencimentoId: string
  dataVencimento: string
  dataCumprimento?: string
  mes: number;
  status: string;
}

export function useVencimentosCondicionante(licencaCondicionanteId: string) {
  const client = useClient()
  return useQuery({
    queryKey: ['vencimentos-condicionante'],
    queryFn: async () => {
      const res = await client.get(`/vencimento-condicionante/list-all/${licencaCondicionanteId}`)
      return res.data
    }
  })
}

export function useCreateVencimentoCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VencimentoCondicionantePayload) => {
      const res = await client.get(`/vencimento-condicionante/create`, { data })
      
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] })
    }
  })
}

export function useUpdateVencimentoCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      vencimentoId,
      ...data
    }: VencimentoCondicionantePayload & { vencimentoId: string }) => {
      const res = await client.put(
        `/vencimento-condicionante/update/${vencimentoId}`, { data }
      )

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] })
    }
  })
}

export function useDeleteVencimentoCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ vencimentoId }: {vencimentoId: string}) => {
      const res = await client.delete(`/vencimento-condicionante/${vencimentoId}`)
      if (res.data?.error) {
        throw new Error(res.data.message || 'Erro ao excluir o item da condicionante')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] })
    }
  })
}
