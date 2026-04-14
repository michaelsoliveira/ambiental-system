import { api } from "../api-client"

export interface GetParceirosResponse {
    parceiros: Array<{
      id: string
      tipo_parceiro: string
      observacoes: string | null
      ativo: boolean
      created_at: string
      updated_at: string
      pessoa: {
        id: string
        email: string | null
        telefone: string | null
        tipo: string
        fisica?: {
          nome: string
          cpf: string | null
        } | null
        juridica?: {
          nome_fantasia: string
          cnpj: string | null
          razao_social: string | null
        } | null
      }
    }>,
    pagination: {
      count: number
      page: number
      limit: number
      total_pages: number
      has_next: boolean
      has_prev: boolean
    }
}

export type ParceiroListRecord = GetParceirosResponse['parceiros'][number]

export async function getParceiros(
  org: string,
  params?: {
    ativo?: boolean
    tipo_parceiro?: 'CLIENTE' | 'FORNECEDOR' | 'AMBOS'
    search?: string
    page?: number
    limit?: number
    orderBy?: 'created_at' | 'tipo_parceiro'
    order?: 'asc' | 'desc'
  },
) {
  const searchParams = new URLSearchParams()
  if (params?.ativo !== undefined) searchParams.append('ativo', String(params.ativo))
  if (params?.tipo_parceiro) searchParams.append('tipo_parceiro', params.tipo_parceiro)
  if (params?.search) searchParams.append('search', params.search)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.orderBy) searchParams.append('orderBy', params.orderBy)
  if (params?.order) searchParams.append('order', params.order)

  const url = `organizations/${org}/financeiro/parceiros${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`

  const result = await api
    .get(url)
    .json<GetParceirosResponse>()

  return result
}