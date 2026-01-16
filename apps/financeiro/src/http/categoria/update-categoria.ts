import { api } from "../api-client"

interface UpdateCategoriaData {
  codigo?: string
  nome?: string
  descricao?: string
  tipo?: 'RECEITA' | 'DESPESA'
  nivel?: number
  parent_id?: string
  ativo?: boolean
}

export async function updateCategoria(org: string, id: string, data: UpdateCategoriaData) {
  const result = await api
    .put(`organizations/${org}/financeiro/categorias/${id}`, { json: data })
    .json<{ categoriaId: string }>()

  return result
}
