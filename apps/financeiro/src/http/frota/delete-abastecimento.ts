import { api } from '../api-client'

export async function deleteAbastecimento(
  org: string,
  veiculoId: string,
  abastecimentoId: string
) {
  await api.delete(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/abastecimentos/${abastecimentoId}`
  )
}
