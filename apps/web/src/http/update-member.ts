import { Role } from '@saas/auth'

import { api } from './api-client'

interface UpdateMemberRequest {
  org: string
  memberId: string
  roles: Role[]
}

export async function updateMember({
  org,
  memberId,
  roles,
}: UpdateMemberRequest) {
  await api.put(`organizations/${org}/members/${memberId}`, {
    json: { roles },
  })
}