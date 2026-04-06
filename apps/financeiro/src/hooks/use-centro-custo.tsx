import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createCentroCusto } from '@/http/centro-custo/create-centro-custo'
import { deleteCentroCusto } from '@/http/centro-custo/delete-centro-custo'
import { getCentrosCusto } from '@/http/centro-custo/get-centros-custo'
import { updateCentroCusto } from '@/http/centro-custo/update-centro-custo'

export function useCentrosCusto(
  org: string,
  params?: {
    ativo?: boolean
    search?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'asc' | 'desc'
  }
) {
  return useQuery({
    queryKey: ['centros-custo', org, params],
    queryFn: () => getCentrosCusto(org, params),
    enabled: !!org,
  })
}

export function useCentroCusto(org: string, id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['centro-custo', org, id],
    queryFn: async () => {
      const { centros } = await getCentrosCusto(org)
      return centros.find((c) => c.id === id)
    },
    enabled: !!org && !!id && enabled,
  })
}

export function useCreateCentroCusto(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createCentroCusto>[1]) =>
      createCentroCusto(org, data),
    onSuccess: () => {
      toast.success('Centro de custo criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['centros-custo', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar centro de custo')
    },
  })
}

export function useUpdateCentroCusto(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof updateCentroCusto>[2]
    }) => updateCentroCusto(org, id, data),
    onSuccess: () => {
      toast.success('Centro de custo atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['centros-custo', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar centro de custo')
    },
  })
}

export function useDeleteCentroCusto(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteCentroCusto(org, id),
    onSuccess: () => {
      toast.success('Centro de custo deletado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['centros-custo', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar centro de custo')
    },
  })
}
