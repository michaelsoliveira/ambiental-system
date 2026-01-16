import { api } from "../api-client"

interface CreateCategoriaData {
  codigo: string
  nome: string
  descricao?: string
  tipo: 'RECEITA' | 'DESPESA'
  nivel?: number
  parent_id?: string
  ativo?: boolean
}

export async function createCategoria(org: string, data: CreateCategoriaData) {
  const result = await api
    .post(`organizations/${org}/financeiro/categorias`, { json: data })
    .json<{ categoriaId: string }>()

  return result
}
