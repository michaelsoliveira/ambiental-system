import { Role } from '@saas/auth'

import { api } from './api-client'

interface GetMembershipResponse {
  membership: {
    id: string
    roles: Role[]
    organization_id: string
    user_id: string
  }
}

export async function getMembership(org: string) {
  const result = await api
    .get(`organization/${org}/membership`)
    .json<GetMembershipResponse>()

  return result
}