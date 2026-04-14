import { api } from '../api-client'

interface CreateCargoFuncionarioData {
  codigo?: string
  nome: string
  descricao?: string
  salario_base: number
  ativo?: boolean
}

export async function createCargoFuncionario(org: string, data: CreateCargoFuncionarioData) {
  return api
    .post(`organizations/${org}/financeiro/cargos-funcionario`, { json: data })
    .json<{ id: string }>()
}
