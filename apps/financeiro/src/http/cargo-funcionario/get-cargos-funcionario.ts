import { api } from '../api-client'

export interface CargoFuncionario {
  id: string
  codigo: string | null
  nome: string
  descricao: string | null
  salario_base: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export async function getCargosFuncionario(
  org: string,
  params?: {
    search?: string
    ativo?: boolean
    page?: number
    limit?: number
  },
) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.append('search', params.search)
  if (params?.ativo !== undefined) searchParams.append('ativo', String(params.ativo))
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))

  const url = `organizations/${org}/financeiro/cargos-funcionario${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`

  return api.get(url).json<{ cargos: CargoFuncionario[]; pagination: any }>()
}

export async function getCargoFuncionario(org: string, id: string) {
  return api.get(`organizations/${org}/financeiro/cargos-funcionario/${id}`).json<{ cargo: CargoFuncionario }>()
}
