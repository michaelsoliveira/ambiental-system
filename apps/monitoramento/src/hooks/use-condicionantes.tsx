'use client'

import { fetchAPI } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useClient from './use-client'

export interface CondicionantePayload {
  condicionanteId: string
  dataAtribuicao: string
  dataCumprimento?: string
  status: string
  diasAntecedencia?: number
}

export function useCondicionantes(params: any) {
  const client = useClient()
  return useQuery({
    queryKey: ['condicionantes', params],
    queryFn: async () => {
      const res = await client.get('/condicionante/list-all', {
        params
      })
      return res.data
    }
  })
}

export function useCreateCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CondicionantePayload) => {
      const res = await client.get(`/condicionante/create`, { data })
      
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condicionantes'] })
    }
  })
}

export function useUpdateCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      condicionanteId,
      ...data
    }: CondicionantePayload & { condicionanteId: string }) => {
      const res = await client.put(
        `/condicionante/update/${condicionanteId}`, { data }
      )

      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condicionantes'] })
    }
  })
}

export function useDeleteCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (condicionanteId: string) => {
      const res = await client.delete(`/condicionante/${condicionanteId}`)
      if (res.data?.error) {
        throw new Error(res.data.message || 'Erro ao excluir condicionante')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['condicionantes'] })
    }
  })
}
