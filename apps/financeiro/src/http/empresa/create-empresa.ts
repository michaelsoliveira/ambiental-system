import { api } from '../api-client'

export async function createEmpresa(org: string, data: { pessoa_id: string }) {
  return api.post(`organizations/${org}/financeiro/empresas`, { json: data }).json<{ id: string }>()
}
