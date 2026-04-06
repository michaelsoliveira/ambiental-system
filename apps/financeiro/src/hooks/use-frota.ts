import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createVeiculo, type CreateVeiculoInput } from '@/http/frota/create-veiculo'
import { deleteAbastecimento } from '@/http/frota/delete-abastecimento'
import { deleteManutencao } from '@/http/frota/delete-manutencao'
import { deleteVeiculo } from '@/http/frota/delete-veiculo'
import { deleteViagem } from '@/http/frota/delete-viagem'
import { getVeiculo } from '@/http/frota/get-veiculo'
import { getVeiculos } from '@/http/frota/get-veiculos'
import { postAbastecimento, type PostAbastecimentoInput } from '@/http/frota/post-abastecimento'
import { postManutencao, type PostManutencaoInput } from '@/http/frota/post-manutencao'
import { postViagem, type PostViagemInput } from '@/http/frota/post-viagem'
import { putAbastecimento } from '@/http/frota/put-abastecimento'
import { putManutencao } from '@/http/frota/put-manutencao'
import { putViagem } from '@/http/frota/put-viagem'
import { updateVeiculo, type UpdateVeiculoInput } from '@/http/frota/update-veiculo'

export function useVeiculos(
  org: string,
  params?: { ativo?: boolean; search?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['frota-veiculos', org, params],
    queryFn: () => getVeiculos(org, params),
    enabled: !!org,
  })
}

export function useVeiculo(org: string, veiculoId: string) {
  return useQuery({
    queryKey: ['frota-veiculo', org, veiculoId],
    queryFn: () => getVeiculo(org, veiculoId),
    enabled: !!org && !!veiculoId,
  })
}

export function useCreateVeiculo(org: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVeiculoInput) => createVeiculo(org, data),
    onSuccess: () => {
      toast.success('Veículo cadastrado.')
      qc.invalidateQueries({ queryKey: ['frota-veiculos', org] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao cadastrar veículo'),
  })
}

export function useUpdateVeiculo(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateVeiculoInput) =>
      updateVeiculo(org, veiculoId, data),
    onSuccess: () => {
      toast.success('Veículo atualizado.')
      qc.invalidateQueries({ queryKey: ['frota-veiculos', org] })
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar'),
  })
}

export function useDeleteVeiculo(org: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (veiculoId: string) => deleteVeiculo(org, veiculoId),
    onSuccess: () => {
      toast.success('Veículo removido.')
      qc.invalidateQueries({ queryKey: ['frota-veiculos', org] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao remover'),
  })
}

export function usePostAbastecimento(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PostAbastecimentoInput) =>
      postAbastecimento(org, veiculoId, data),
    onSuccess: () => {
      toast.success('Abastecimento registrado (lançamento gerado).')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
      qc.invalidateQueries({ queryKey: ['frota-veiculos', org] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao registrar'),
  })
}

export function usePostManutencao(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PostManutencaoInput) =>
      postManutencao(org, veiculoId, data),
    onSuccess: () => {
      toast.success('Manutenção registrada (lançamento gerado).')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao registrar'),
  })
}

export function usePostViagem(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PostViagemInput) => postViagem(org, veiculoId, data),
    onSuccess: () => {
      toast.success('Viagem registrada.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao registrar'),
  })
}

export function usePutAbastecimento(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { abastecimentoId: string; data: PostAbastecimentoInput }) =>
      putAbastecimento(org, veiculoId, input.abastecimentoId, input.data),
    onSuccess: () => {
      toast.success('Abastecimento atualizado.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
      qc.invalidateQueries({ queryKey: ['frota-veiculos', org] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar'),
  })
}

export function useDeleteAbastecimento(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (abastecimentoId: string) =>
      deleteAbastecimento(org, veiculoId, abastecimentoId),
    onSuccess: () => {
      toast.success('Abastecimento excluído.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
      qc.invalidateQueries({ queryKey: ['frota-veiculos', org] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao excluir'),
  })
}

export function usePutManutencao(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { manutencaoId: string; data: PostManutencaoInput }) =>
      putManutencao(org, veiculoId, input.manutencaoId, input.data),
    onSuccess: () => {
      toast.success('Manutenção atualizada.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar'),
  })
}

export function useDeleteManutencao(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (manutencaoId: string) =>
      deleteManutencao(org, veiculoId, manutencaoId),
    onSuccess: () => {
      toast.success('Manutenção excluída.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao excluir'),
  })
}

export function usePutViagem(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { viagemId: string; data: PostViagemInput }) =>
      putViagem(org, veiculoId, input.viagemId, input.data),
    onSuccess: () => {
      toast.success('Viagem atualizada.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar'),
  })
}

export function useDeleteViagem(org: string, veiculoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (viagemId: string) => deleteViagem(org, veiculoId, viagemId),
    onSuccess: () => {
      toast.success('Viagem excluída.')
      qc.invalidateQueries({ queryKey: ['frota-veiculo', org, veiculoId] })
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao excluir'),
  })
}
