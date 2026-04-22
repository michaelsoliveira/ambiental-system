import { api } from '../api-client'
import type { PostDisponibilidadeInput } from './post-disponibilidade'

export async function putDisponibilidade(
  org: string,
  veiculoId: string,
  disponibilidadeId: string,
  data: PostDisponibilidadeInput,
) {
  await api.put(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/disponibilidades/${disponibilidadeId}`,
    { json: data },
  )
}
