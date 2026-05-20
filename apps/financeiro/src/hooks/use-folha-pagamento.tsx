import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { api } from '@/http/api-client'
import { queryClient } from '@/lib/react-query'

export function useFolhasPagamento(org: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['folhas-pagamento', org, params],
    enabled: !!org,
    queryFn: async () =>
      api
        .get(`organizations/${org}/financeiro/folhas-pagamento`, { searchParams: params })
        .json<any>(),
  })
}

export function useFolhaPagamento(org: string, id?: string) {
  return useQuery({
    queryKey: ['folha-pagamento', org, id],
    enabled: !!org && !!id,
    queryFn: async () => api.get(`organizations/${org}/financeiro/folhas-pagamento/${id}`).json<any>(),
  })
}

export function useRubricasFolha(org: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['rubricas-folha', org, params],
    enabled: !!org,
    queryFn: async () =>
      api
        .get(`organizations/${org}/financeiro/folhas-pagamento/rubricas`, { searchParams: params })
        .json<any>(),
  })
}

export function useFolhaPagamentoRelatorio(org: string, params: Record<string, any> | null) {
  return useQuery({
    queryKey: ['folhas-pagamento-relatorio', org, params],
    enabled: !!org && !!params,
    queryFn: async () =>
      api
        .get(`organizations/${org}/financeiro/folhas-pagamento/relatorio`, { searchParams: params ?? {} })
        .json<any>(),
  })
}

export function useCreateFolhaPagamento(org: string) {
  return useMutation({
    mutationFn: async (data: any) =>
      api.post(`organizations/${org}/financeiro/folhas-pagamento`, { json: data }).json<any>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento', org] })
      toast.success('Folha criada com sucesso.')
    },
    onError: (error: any) => {
      toast.error(error?.message ?? error?.response?.message ?? 'Não foi possível criar a folha.')
    },
  })
}

export function useCreateFolhaItem(org: string) {
  return useMutation({
    mutationFn: async ({ folhaId, ...data }: any) =>
      api
        .post(`organizations/${org}/financeiro/folhas-pagamento/${folhaId}/itens`, { json: data })
        .json<any>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento', org] })
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento', org] })
      toast.success('Item da folha adicionado.')
    },
  })
}

export function useUpdateFolhaItem(org: string) {
  return useMutation({
    mutationFn: async ({ folhaId, itemId, ...data }: any) =>
      api
        .patch(`organizations/${org}/financeiro/folhas-pagamento/${folhaId}/itens/${itemId}`, {
          json: data,
        })
        .json<any>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento', org] })
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento', org] })
      toast.success('Item da folha atualizado.')
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Erro ao atualizar item da folha.')
    },
  })
}

export function useDeleteFolhaItem(org: string) {
  return useMutation({
    mutationFn: async ({ folhaId, itemId }: { folhaId: string; itemId: string }) =>
      api.delete(`organizations/${org}/financeiro/folhas-pagamento/${folhaId}/itens/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folhas-pagamento', org] })
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento', org] })
      toast.success('Item da folha removido.')
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Erro ao remover item da folha.')
    },
  })
}

export function useFolhaActions(org: string) {
  const call = (action: 'close' | 'reopen' | 'pay' | 'unpay', successText: string) =>
    useMutation({
      mutationFn: async (folhaId: string) =>
        api
          .patch(`organizations/${org}/financeiro/folhas-pagamento/${folhaId}/${action}`)
          .json<any>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['folhas-pagamento', org] })
        queryClient.invalidateQueries({ queryKey: ['folha-pagamento', org] })
        toast.success(successText)
      },
    })

  return {
    closeFolha: call('close', 'Folha fechada com sucesso.'),
    reopenFolha: call('reopen', 'Folha reaberta com sucesso.'),
    payFolha: call('pay', 'Folha marcada como paga.'),
    unpayFolha: call('unpay', 'Pagamento estornado. A folha voltou para fechada.'),
  }
}
