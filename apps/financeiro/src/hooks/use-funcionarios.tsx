import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/http/api-client'
import { queryClient } from '@/lib/react-query'

export function useFuncionarios(org: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['funcionarios', org, params],
    enabled: !!org,
    queryFn: async () =>
      api
        .get(`organizations/${org}/financeiro/funcionarios`, { searchParams: params })
        .json<any>(),
  })
}

export function useCreateFuncionario(org: string) {
  return useMutation({
    mutationFn: async (data: any) =>
      api.post(`organizations/${org}/financeiro/funcionarios`, { json: data }).json<any>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios', org] })
      toast.success('Funcionário cadastrado com sucesso.')
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Erro ao cadastrar funcionário.')
    },
  })
}

export function useUpdateFuncionario(org: string) {
  return useMutation({
    mutationFn: async ({ id, ...data }: any) =>
      api.put(`organizations/${org}/financeiro/funcionarios/${id}`, { json: data }).json<any>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios', org] })
      toast.success('Funcionário atualizado com sucesso.')
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Erro ao atualizar funcionário.')
    },
  })
}

export function useDeleteFuncionario(org: string) {
  return useMutation({
    mutationFn: async (id: string) =>
      api.delete(`organizations/${org}/financeiro/funcionarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios', org] })
      toast.success('Funcionário removido com sucesso.')
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Erro ao remover funcionário.')
    },
  })
}
