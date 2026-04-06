import { api } from '../api-client'

export type UpdateVeiculoInput = {
  placa?: string
  modelo?: string
  marca?: string
  ano?: number | null
  tipo?: string | null
  km_atual?: number | null
  ativo?: boolean
}

export async function updateVeiculo(
  org: string,
  veiculoId: string,
  data: UpdateVeiculoInput
) {
  return api
    .patch(`organizations/${org}/financeiro/frota/veiculos/${veiculoId}`, {
      json: data,
    })
    .json<{ ok: true }>()
}
