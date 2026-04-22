import { api } from '../api-client'

export async function deleteDisponibilidade(
  org: string,
  veiculoId: string,
  disponibilidadeId: string,
) {
  await api.delete(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/disponibilidades/${disponibilidadeId}`,
  )
}
