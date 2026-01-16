import { api } from "../api-client"

interface UpdateCentroCustoData {
  codigo?: string
  nome?: string
  descricao?: string
  ativo?: boolean
}

export async function updateCentroCusto(org: string, id: string, data: UpdateCentroCustoData) {
  const result = await api
    .put(`organizations/${org}/financeiro/centros-custo/${id}`, { json: data })
    .json<{ centroCustoId: string }>()

  return result
}
