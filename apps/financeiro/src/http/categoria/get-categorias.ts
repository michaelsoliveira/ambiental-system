import { api } from "../api-client"

interface GetCategoriasResponse {
  categorias: Array<{
    id: string
    codigo: string
    nome: string
    descricao: string | null
    tipo: 'RECEITA' | 'DESPESA'
    nivel: number
    parent_id: string | null
    ativo: boolean
    created_at: string
    updated_at: string
  }>
  total: number
}

export async function getCategorias(
  org: string,
  params?: {
    tipo?: 'RECEITA' | 'DESPESA'
    ativo?: boolean
    search?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'asc' | 'desc'
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.tipo) searchParams.append('tipo', params.tipo)
  if (params?.ativo !== undefined) searchParams.append('ativo', String(params.ativo))
  if (params?.search) searchParams.append('search', params.search)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.orderBy) searchParams.append('orderBy', params.orderBy)
  if (params?.order) searchParams.append('order', params.order)

  const url = `organizations/${org}/financeiro/categorias${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  const result = await api
    .get(url)
    .json<GetCategoriasResponse>()

  return result
}
