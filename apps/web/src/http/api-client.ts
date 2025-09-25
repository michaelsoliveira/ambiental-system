// src/http/api-client.ts (sem 'use server')
import { env } from '@saas/env'
import ky from 'ky'

export const api = ky.create({
  prefixUrl: env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        let token: string | undefined

        if (typeof window === 'undefined') {
          // Server-side
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          token = cookieStore.get('token')?.value
        } else {
          // Client-side
          const { getCookie } = await import('cookies-next')
          token = getCookie('token') as string | undefined
        }

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})