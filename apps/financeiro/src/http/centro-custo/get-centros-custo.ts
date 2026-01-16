import { api } from "../api-client"

interface GetCentrosCustoResponse {
  centros: Array<{
    id: string
    codigo: string
    nome: string
    descricao: string | null
    ativo: boolean
    created_at: string
    updated_at: string
  }>
  total: number
}

export async function getCentrosCusto(
  org: string,
  params?: {
    ativo?: boolean
    search?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'asc' | 'desc'
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.ativo !== undefined) searchParams.append('ativo', String(params.ativo))
  if (params?.search) searchParams.append('search', params.search)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.orderBy) searchParams.append('orderBy', params.orderBy)
  if (params?.order) searchParams.append('order', params.order)

  const url = `organizations/${org}/financeiro/centros-custo${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  const result = await api
    .get(url)
    .json<GetCentrosCustoResponse>()

  return result
}
