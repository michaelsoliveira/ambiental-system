import { api } from "../api-client"

export async function deleteCategoria(org: string, id: string) {
  await api.delete(`organizations/${org}/financeiro/categorias/${id}`)
}
