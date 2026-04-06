import { api } from '../api-client'

export type PostViagemInput = {
  origem: string
  destino: string
  dataInicio: string
  dataFim?: string | null
  kmRodado?: number | null
  valorReceita?: number | null
  categoriaId?: string | null
  contaBancariaId?: string | null
  centroCustoId?: string | null
  pago?: boolean
}

export async function postViagem(
  org: string,
  veiculoId: string,
  data: PostViagemInput
) {
  return api
    .post(
      `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/viagens`,
      { json: data }
    )
    .json<{ viagemId: string; lancamentoId: string | null }>()
}
