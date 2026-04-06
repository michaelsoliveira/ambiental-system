import { api } from '../api-client'

export type VeiculoListItem = {
  id: string
  organization_id: string
  placa: string
  modelo: string
  marca: string
  ano: number | null
  tipo: string | null
  km_atual: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export async function getVeiculos(
  org: string,
  params?: {
    ativo?: boolean
    search?: string
    page?: number
    limit?: number
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.ativo !== undefined) searchParams.append('ativo', String(params.ativo))
  if (params?.search) searchParams.append('search', params.search)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))

  const q = searchParams.toString()
  const url = `organizations/${org}/financeiro/frota/veiculos${q ? `?${q}` : ''}`

  return api
    .get(url)
    .json<{ veiculos: VeiculoListItem[]; total: number }>()
}
