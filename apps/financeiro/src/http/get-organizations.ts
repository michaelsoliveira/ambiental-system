import { api } from './api-client'

interface GetOrganizationsResponse {
  organizations: {
    id: string
    name: string
    slug: string
    avatarUrl: string | null
  }[]
}

export async function getOrganizations() {
  try {
    const result = await api.get('organizations').json<GetOrganizationsResponse>()
    return result
  } catch (error: any) {
    console.error('[getOrganizations] ❌ Erro ao buscar organizações:', error)
    // Retornar estrutura vazia em caso de erro para não quebrar a aplicação
    return { organizations: [] }
  }
}