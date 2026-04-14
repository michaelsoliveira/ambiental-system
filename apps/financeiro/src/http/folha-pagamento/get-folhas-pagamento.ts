import { api } from '../api-client'

export async function getFolhasPagamento(org: string, params: Record<string, any> = {}) {
  return api
    .get(`organizations/${org}/financeiro/folhas-pagamento`, { searchParams: params })
    .json<any>()
}

export async function getFolhaPagamento(org: string, id: string) {
  return api.get(`organizations/${org}/financeiro/folhas-pagamento/${id}`).json<any>()
}
