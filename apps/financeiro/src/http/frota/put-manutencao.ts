import { api } from '../api-client'
import type { PostManutencaoInput } from './post-manutencao'

export async function putManutencao(
  org: string,
  veiculoId: string,
  manutencaoId: string,
  data: PostManutencaoInput
) {
  await api.put(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/manutencoes/${manutencaoId}`,
    { json: data }
  )
}
