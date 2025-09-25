import { api } from './api-client'

interface CreateOrganizationRequest {
  name: string
  domain: string | null
  shouldAttachDomain: boolean
}

type CreateOrganizationResponse = void

export async function createOrganization({
  name,
  domain,
  shouldAttachDomain,
}: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
  await api.post('organizations', {
    json: {
      name,
      domain,
      shouldAttachDomain,
    },
  })
}