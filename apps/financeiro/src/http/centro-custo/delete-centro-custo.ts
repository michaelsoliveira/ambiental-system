import { api } from "../api-client"

export async function deleteCentroCusto(org: string, id: string) {
  await api.delete(`organizations/${org}/financeiro/centros-custo/${id}`)
}
