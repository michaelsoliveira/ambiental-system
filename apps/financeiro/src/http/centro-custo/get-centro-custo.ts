import { api } from '../api-client'

export type CentroCustoDetail = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at?: string
}

interface GetCentroCustoResponse {
  centroCusto: CentroCustoDetail
}

export async function getCentroCusto(org: string, centroId: string) {
  return api
    .get(`organizations/${org}/financeiro/centros-custo/${centroId}`)
    .json<GetCentroCustoResponse>()
}
