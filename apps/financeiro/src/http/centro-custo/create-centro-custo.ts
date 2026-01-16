import { api } from "../api-client"

interface CreateCentroCustoData {
  codigo: string
  nome: string
  descricao?: string
  ativo?: boolean
}

export async function createCentroCusto(org: string, data: CreateCentroCustoData) {
  const result = await api
    .post(`organizations/${org}/financeiro/centros-custo`, { json: data })
    .json<{ centroCustoId: string }>()

  return result
}
