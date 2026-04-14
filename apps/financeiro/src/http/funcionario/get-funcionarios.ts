import { api } from '../api-client'

export interface GetFuncionariosResponse {
  funcionarios: any[]
  pagination: {
    count: number
    page: number
    limit: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export async function getFuncionarios(org: string, params: Record<string, any> = {}) {
  return api
    .get(`organizations/${org}/financeiro/funcionarios`, { searchParams: params })
    .json<GetFuncionariosResponse>()
}
