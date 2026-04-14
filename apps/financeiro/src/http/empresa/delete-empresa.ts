import { api } from '../api-client'

export async function deleteEmpresa(org: string, id: string) {
  await api.delete(`organizations/${org}/financeiro/empresas/${id}`)
}
