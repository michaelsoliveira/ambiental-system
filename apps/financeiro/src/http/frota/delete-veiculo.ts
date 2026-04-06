import { api } from '../api-client'

export async function deleteVeiculo(org: string, veiculoId: string) {
  await api.delete(`organizations/${org}/financeiro/frota/veiculos/${veiculoId}`)
}
