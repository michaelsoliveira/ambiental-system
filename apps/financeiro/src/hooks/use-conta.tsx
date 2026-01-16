import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getContas } from '@/http/conta/get-contas'
import { createConta } from '@/http/conta/create-conta'
import { updateConta } from '@/http/conta/update-conta'
import { deleteConta } from '@/http/conta/delete-conta'

export function useContas(
  org: string,
  params?: {
    ativo?: boolean
    tipo?: 'BANCARIA' | 'CONTABIL'
    search?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'asc' | 'desc'
  }
) {
  return useQuery({
    queryKey: ['contas', org, params],
    queryFn: () => getContas(org, params),
    enabled: !!org,
  })
}

export function useConta(org: string, id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['conta', org, id],
    queryFn: async () => {
      const { contas } = await getContas(org)
      return contas.find((c) => c.id === id)
    },
    enabled: !!org && !!id && enabled,
  })
}

export function useCreateConta(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createConta>[1]) =>
      createConta(org, data),
    onSuccess: () => {
      toast.success('Conta criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['contas', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar conta')
    },
  })
}

export function useUpdateConta(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof updateConta>[2]
    }) => updateConta(org, id, data),
    onSuccess: () => {
      toast.success('Conta atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['contas', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar conta')
    },
  })
}

export function useDeleteConta(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteConta(org, id),
    onSuccess: () => {
      toast.success('Conta deletada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['contas', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar conta')
    },
  })
}
