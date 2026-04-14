import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createCargoFuncionario } from '@/http/cargo-funcionario/create-cargo-funcionario'
import { deleteCargoFuncionario } from '@/http/cargo-funcionario/delete-cargo-funcionario'
import { getCargoFuncionario, getCargosFuncionario } from '@/http/cargo-funcionario/get-cargos-funcionario'
import { updateCargoFuncionario } from '@/http/cargo-funcionario/update-cargo-funcionario'
import { queryClient } from '@/lib/react-query'

export function useCargosFuncionario(org: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['cargos-funcionario', org, params],
    enabled: !!org,
    queryFn: () => getCargosFuncionario(org, params),
  })
}

export function useCargoFuncionario(org: string, id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['cargo-funcionario', org, id],
    enabled: !!org && !!id && enabled,
    queryFn: () => getCargoFuncionario(org, id),
  })
}

export function useCreateCargoFuncionario(org: string) {
  return useMutation({
    mutationFn: (data: Parameters<typeof createCargoFuncionario>[1]) =>
      createCargoFuncionario(org, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-funcionario', org] })
      toast.success('Cargo criado com sucesso.')
    },
  })
}

export function useUpdateCargoFuncionario(org: string) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCargoFuncionario>[2] }) =>
      updateCargoFuncionario(org, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-funcionario', org] })
      toast.success('Cargo atualizado com sucesso.')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar cargo')
    },
  })
}

export function useDeleteCargoFuncionario(org: string) {
  return useMutation({
    mutationFn: (id: string) => deleteCargoFuncionario(org, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos-funcionario', org] })
      toast.success('Cargo excluído com sucesso.')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir cargo')
    },
  })
}
