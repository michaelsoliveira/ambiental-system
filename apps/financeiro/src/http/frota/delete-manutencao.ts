import { api } from '../api-client'

export async function deleteManutencao(
  org: string,
  veiculoId: string,
  manutencaoId: string
) {
  await api.delete(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/manutencoes/${manutencaoId}`
  )
}
