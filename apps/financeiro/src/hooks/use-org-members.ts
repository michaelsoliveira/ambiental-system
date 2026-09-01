'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'

import { api } from '@/http/api-client'

export type OrgMember = {
  id: string
  user_id: string
  name: string | null
  email: string
  avatarUrl: string | null
  user?: {
    id: string
    nome?: string | null
    username?: string | null
    email?: string
    is_active?: boolean
  }
}

/**
 * Membros da organização — shape adaptado para o header de conversa omnichannel
 * (antes usava useClinicaMembers do iNexaHub).
 */
export function useOrgMembers(orgSlug?: string | null) {
  const params = useParams()
  const org =
    orgSlug || (typeof params.slug === 'string' ? params.slug : '')

  return useQuery({
    queryKey: ['org-members', org],
    enabled: !!org,
    queryFn: async () => {
      const result = await api
        .get(`organizations/${org}/members`)
        .json<{
          members: Array<{
            id: string
            userId: string
            name: string | null
            email: string
            avatarUrl: string | null
          }>
        }>()

      return result.members.map(
        (m): OrgMember => ({
          id: m.id,
          user_id: m.userId,
          name: m.name,
          email: m.email,
          avatarUrl: m.avatarUrl,
          user: {
            id: m.userId,
            nome: m.name,
            email: m.email,
            is_active: true,
          },
        }),
      )
    },
  })
}
