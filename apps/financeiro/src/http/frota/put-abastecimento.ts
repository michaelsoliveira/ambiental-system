import { api } from '../api-client'
import type { PostAbastecimentoInput } from './post-abastecimento'

export async function putAbastecimento(
  org: string,
  veiculoId: string,
  abastecimentoId: string,
  data: PostAbastecimentoInput
) {
  await api.put(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/abastecimentos/${abastecimentoId}`,
    { json: data }
  )
}
