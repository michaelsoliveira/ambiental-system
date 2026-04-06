import { api } from '../api-client'

export type PostManutencaoInput = {
  tipo: string
  descricao?: string | null
  data: string
  valor: number
  categoriaId: string
  contaBancariaId: string
  centroCustoId?: string | null
  pago?: boolean
}

export async function postManutencao(
  org: string,
  veiculoId: string,
  data: PostManutencaoInput
) {
  return api
    .post(
      `organizations/${org}/financeiro/frota/veiculos/${veiculoId}/manutencoes`,
      { json: data }
    )
    .json<{ manutencaoId: string; lancamentoId: string }>()
}
