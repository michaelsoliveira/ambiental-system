import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createPatrimonioAtivo,
  createPatrimonioAvaliacao,
  createPatrimonioPassivo,
  deletePatrimonioAtivo,
  deletePatrimonioPassivo,
  getPatrimonioAtivos,
  getPatrimonioPassivos,
  getPatrimonioResumo,
  updatePatrimonioAtivo,
  updatePatrimonioPassivo,
} from '@/http/patrimonio'

type ListParams = {
  search?: string
  categoria?: string
  tipo?: string
  status?: string
  page?: number
  limit?: number
}

export function usePatrimonioResumo(org: string) {
  return useQuery({
    queryKey: ['patrimonio-resumo', org],
    queryFn: () => getPatrimonioResumo(org),
    enabled: !!org,
  })
}

export function usePatrimonioAtivos(org: string, params?: ListParams) {
  return useQuery({
    queryKey: ['patrimonio-ativos', org, params],
    queryFn: () => getPatrimonioAtivos(org, params),
    enabled: !!org,
  })
}

export function usePatrimonioPassivos(org: string, params?: ListParams) {
  return useQuery({
    queryKey: ['patrimonio-passivos', org, params],
    queryFn: () => getPatrimonioPassivos(org, params),
    enabled: !!org,
  })
}

export function useCreatePatrimonioAtivo(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof createPatrimonioAtivo>[1]) =>
      createPatrimonioAtivo(org, data),
    onSuccess: () => {
      toast.success('Ativo patrimonial criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-ativos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao criar ativo patrimonial'),
  })
}

export function useUpdatePatrimonioAtivo(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePatrimonioAtivo>[2] }) =>
      updatePatrimonioAtivo(org, id, data),
    onSuccess: () => {
      toast.success('Ativo patrimonial atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-ativos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao atualizar ativo patrimonial'),
  })
}

export function useDeletePatrimonioAtivo(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePatrimonioAtivo(org, id),
    onSuccess: () => {
      toast.success('Ativo patrimonial excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-ativos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao excluir ativo patrimonial'),
  })
}

export function useCreatePatrimonioAvaliacao(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ativoId, data }: { ativoId: string; data: Parameters<typeof createPatrimonioAvaliacao>[2] }) =>
      createPatrimonioAvaliacao(org, ativoId, data),
    onSuccess: () => {
      toast.success('Avaliação registrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-ativos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao registrar avaliação'),
  })
}

export function useCreatePatrimonioPassivo(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof createPatrimonioPassivo>[1]) =>
      createPatrimonioPassivo(org, data),
    onSuccess: () => {
      toast.success('Passivo patrimonial criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-passivos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao criar passivo patrimonial'),
  })
}

export function useUpdatePatrimonioPassivo(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePatrimonioPassivo>[2] }) =>
      updatePatrimonioPassivo(org, id, data),
    onSuccess: () => {
      toast.success('Passivo patrimonial atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-passivos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao atualizar passivo patrimonial'),
  })
}

export function useDeletePatrimonioPassivo(org: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deletePatrimonioPassivo(org, id),
    onSuccess: () => {
      toast.success('Passivo patrimonial excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['patrimonio-passivos', org] })
      queryClient.invalidateQueries({ queryKey: ['patrimonio-resumo', org] })
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao excluir passivo patrimonial'),
  })
}
