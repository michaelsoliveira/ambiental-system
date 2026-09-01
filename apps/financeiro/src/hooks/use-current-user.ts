'use client'

import { useQuery } from '@tanstack/react-query'

import { api } from '@/http/api-client'

/** Perfil do usuário autenticado (substitui next-auth useSession no omnichannel). */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const result = await api.get('profile').json<{
        user: {
          id: string
          username: string | null
          email: string
          avatarUrl: string | null
        }
      }>()
      return result.user
    },
    staleTime: 60_000,
  })
}
