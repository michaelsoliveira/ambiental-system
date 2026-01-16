import { api } from "../api-client"

export async function deleteConta(org: string, id: string) {
  await api.delete(`organizations/${org}/financeiro/contas/${id}`)
}
