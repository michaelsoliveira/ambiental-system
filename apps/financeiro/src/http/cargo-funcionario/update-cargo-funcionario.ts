import { api } from '../api-client'

interface UpdateCargoFuncionarioData {
  codigo?: string
  nome?: string
  descricao?: string
  salario_base?: number
  ativo?: boolean
}

export async function updateCargoFuncionario(
  org: string,
  id: string,
  data: UpdateCargoFuncionarioData,
) {
  return api
    .put(`organizations/${org}/financeiro/cargos-funcionario/${id}`, { json: data })
    .json<{ id: string }>()
}
