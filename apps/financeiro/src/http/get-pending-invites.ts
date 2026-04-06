// src/http/get-pending-invites.ts
import { Role } from '@saas/auth'

import { api } from './api-client' // ✅ Agora funciona no cliente

interface GetPendingInvitesResponse {
  invites: {
    organization: {
      name: string
    }
    id: string
    role: Role
    email: string
    created_at: string
    author: {
      id: string
      username: string | null
      avatarUrl: string | null
    } | null
  }[]
}

export async function getPendingInvites(): Promise<GetPendingInvitesResponse> {
  const result = await api
    .get('pending-invites')
    .json<GetPendingInvitesResponse>()
  
  console.log('getPendingInvites result:', result)
  return result
}