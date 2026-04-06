import { api } from '../api-client'

export type PostAbastecimentoInput = {
  data: string
  litros: number
  valor: number
  km?: number | null
  categoriaId: string
  contaBancariaId: string
  centroCustoId?: string | null
  pago?: boolean
}

export async function postAbastecimento(
  org: string,
  veiculoId: string,
  data: PostAbastecimentoInput
) {
  return api
    .post(
      `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/abastecimentos`,
      { json: data }
    )
    .json<{ abastecimentoId: string; lancamentoId: string }>()
}
