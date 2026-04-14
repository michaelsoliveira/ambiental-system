import { api } from '../api-client'

export async function updateEmpresa(org: string, id: string, data: { pessoa_id?: string }) {
  return api.put(`organizations/${org}/financeiro/empresas/${id}`, { json: data }).json<{ id: string }>()
}
