import { api } from '../api-client'

export interface EmpresaRecord {
  id: string
  pessoa_id: string
  pessoa: {
    fisica?: { nome: string } | null
    juridica?: { nome_fantasia: string; razao_social?: string | null } | null
  }
}

export async function getEmpresas(
  org: string,
  params?: { search?: string; page?: number; limit?: number },
) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.append('search', params.search)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))

  const url = `organizations/${org}/financeiro/empresas${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`

  return api.get(url).json<{ empresas: EmpresaRecord[]; pagination: any }>()
}

export async function getEmpresa(org: string, id: string) {
  return api.get(`organizations/${org}/financeiro/empresas/${id}`).json<{ empresa: EmpresaRecord }>()
}
