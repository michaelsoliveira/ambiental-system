import { api } from '../api-client'
import type { PostViagemInput } from './post-viagem'

export async function putViagem(
  org: string,
  veiculoId: string,
  viagemId: string,
  data: PostViagemInput
) {
  await api.put(
    `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/viagens/${viagemId}`,
    { json: data }
  )
}
