import { api } from './api-client'

interface GetOrganizationResponse {
  organization: {
    slug: string
    id: string
    name: string
    domain: string | null
    shouldAttachDomain: boolean
    avatarUrl: string | null
    created_at: string
    updated_at: string
    owner_id: string
  }
}

export async function getOrganization(org: string) {
  const result = await api
    .get(`organizations/${org}`, {
      next: {
        tags: ['organization'],
      },
    })
    .json<GetOrganizationResponse>()

  return result
}