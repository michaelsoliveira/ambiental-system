import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createCategoria } from '@/http/categoria/create-categoria'
import { deleteCategoria } from '@/http/categoria/delete-categoria'
import { getCategorias } from '@/http/categoria/get-categorias'
import { updateCategoria } from '@/http/categoria/update-categoria'

export function useCategorias(
  org: string,
  params?: {
    tipo?: 'RECEITA' | 'DESPESA'
    ativo?: boolean
    search?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'asc' | 'desc'
  }
) {
  return useQuery({
    queryKey: ['categorias', org, params],
    queryFn: () => getCategorias(org, params),
    enabled: !!org,
  })
}

export function useCategoria(org: string, id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['categoria', org, id],
    queryFn: async () => {
      const { categorias } = await getCategorias(org)
      return categorias.find((c) => c.id === id)
    },
    enabled: !!org && !!id && enabled,
  })
}

export function useCreateCategoria(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createCategoria>[1]) =>
      createCategoria(org, data),
    onSuccess: () => {
      toast.success('Categoria criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['categorias', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar categoria')
    },
  })
}

export function useUpdateCategoria(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof updateCategoria>[2]
    }) => updateCategoria(org, id, data),
    onSuccess: () => {
      toast.success('Categoria atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['categorias', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar categoria')
    },
  })
}

export function useDeleteCategoria(org: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteCategoria(org, id),
    onSuccess: () => {
      toast.success('Categoria deletada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['categorias', org] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar categoria')
    },
  })
}
