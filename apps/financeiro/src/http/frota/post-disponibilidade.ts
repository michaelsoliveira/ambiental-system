import { api } from '../api-client'

export type PostDisponibilidadeInput = {
  tipo: 'PRODUCAO' | 'MANUTENCAO'
  inicio: string
  fim: string
  motivo?: string | null
}

export async function postDisponibilidade(
  org: string,
  veiculoId: string,
  data: PostDisponibilidadeInput,
) {
  return api
    .post(
      `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/disponibilidades`,
      { json: data },
    )
    .json<{ disponibilidadeId: string }>()
}
