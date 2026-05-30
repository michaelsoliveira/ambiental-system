import { api } from '../api-client'

export type CategoriaDetail = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  tipo: 'RECEITA' | 'DESPESA'
  parent_id: string | null
  ativo: boolean
  created_at: string
  updated_at?: string
}

interface GetCategoriaResponse {
  categoria: CategoriaDetail
}

export async function getCategoria(org: string, categoriaId: string) {
  return api
    .get(`organizations/${org}/financeiro/categorias/${categoriaId}`)
    .json<GetCategoriaResponse>()
}
