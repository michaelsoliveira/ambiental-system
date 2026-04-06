import { api } from '../api-client'

export async function deleteViagem(
  org: string,
  veiculoId: string,
  viagemId: string
) {
  await api.delete(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/viagens/${viagemId}`
  )
}
