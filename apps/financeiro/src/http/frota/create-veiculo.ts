import { api } from '../api-client'

export type CreateVeiculoInput = {
  placa: string
  modelo: string
  marca: string
  ano?: number | null
  tipo?: string | null
  km_atual?: number | null
  ativo?: boolean
}

export async function createVeiculo(org: string, data: CreateVeiculoInput) {
  return api
    .post(`organizations/${org}/financeiro/frota/veiculos`, { json: data })
    .json<{ veiculoId: string }>()
}
