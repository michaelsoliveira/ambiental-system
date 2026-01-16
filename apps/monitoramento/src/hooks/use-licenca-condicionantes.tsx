// lib/hooks/useCondicionantes.ts
import { fetchAPI } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useClient from './use-client'
import { CondicionanteFrequenciaType } from 'types';

export interface CondicionantePayload {
  id: string;
  licencaId: string;
  condicionanteId: string;
  dataAtribuicao: string;
  dataCumprimento?: string | undefined;
  dataVencimento?: string | undefined;
  frequencia?: CondicionanteFrequenciaType
  meses?: number[];
  status?: string;
  diasAntecedencia?: number
}

export function useLicencaCondicionantes(licencaId: string, params: any) {
  const client = useClient()
  return useQuery({
    queryKey: ['licenca-condicionantes', licencaId, params],
    queryFn: async () => {
      const res = await client.get(`/licenca-condicionante/list-all/${licencaId}`, {
        params
      })
      return res.data
    }
  })
}

export function useLicencaCondicionanteById(id: string) {
  const client = useClient()
  return useQuery({
    queryKey: ['licenca-condicionante', id],
    queryFn: async () => {
      const res = await client.get(`/licenca-condicionante/find-one/${id}`)
      return res.data
    }
  })
}

export function useCreateLicencaCondicionante(licencaId: string) {
  const queryClient = useQueryClient()
  const client = useClient()

  return useMutation({
    mutationFn: async (data: CondicionantePayload) => {
       const payload = {
        ...data,
        dataAtribuicao: data.dataAtribuicao,
        dataCumprimento: data.dataCumprimento,
        dataVencimento: data.dataVencimento,
        licencaId
      }

      const res = await client.post(`/licenca-condicionante/create`, {
        data: payload
      })
      
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes', licencaId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-totals'] })
    }
  })
}

export function useUpdateLicencaCondicionante() {
  const queryClient = useQueryClient()
  const client = useClient()
  return useMutation({
    mutationFn: async ({
      ...data
    }: CondicionantePayload) => {
      
      const payload = {
        ...data,
        dataAtribuicao: data.dataAtribuicao,
        dataCumprimento: data.dataCumprimento,
        dataVencimento: data.dataVencimento,
      }
      
      const res = await client.put(
        `/licenca-condicionante/${payload.id}`,
        {
          data: { ...payload }
        }
      )
      
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] })
    }
  })
}

export function useReturnCondicionante() {
  const queryClient = useQueryClient()
  const client = useClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {

      const res = await client.put(`/vencimento-condicionante/${id}/return-condicionante`)
      
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] })
    }
  })
}

export function useDeleteLicencaCondicionante() {
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await client.delete(`/licenca-condicionante/${id}`)
      if (res.data?.error) {
        throw new Error(res.data.message || 'Erro ao excluir a licença condicionante')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenca-condicionantes'] })
    }
  })
}
