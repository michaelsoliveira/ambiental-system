import { Role } from '@saas/auth'

import { api } from './api-client'

interface GetRolesResponse {
  roles: {
    id: string
    name: string
  }[]
}

export async function getRoles() {
  const result = await api
    .get('roles')
    .json<GetRolesResponse>()

  return result
}