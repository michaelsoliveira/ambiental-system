import { api } from '../api-client'

export async function deleteCargoFuncionario(org: string, id: string) {
  await api.delete(`organizations/${org}/financeiro/cargos-funcionario/${id}`)
}
