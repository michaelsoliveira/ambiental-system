// src/http/api-client.ts (sem 'use server')
import { env } from '@saas/env/next'
import ky from 'ky'

function isMediaFetch(url: string): boolean {
  try {
    return new URL(url).pathname.endsWith('/media')
  } catch {
    return url.includes('/media')
  }
}

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
    afterResponse: [
      async (request, _options, response) => {
        if (response.ok) return

        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        let errorData: unknown = null
        let errorBodyText: string | null = null
        const responseClone = response.clone()

        try {
          errorData = await responseClone.json()
          const data = errorData as { message?: string; error?: string } | null
          errorMessage = data?.message || data?.error || errorMessage
        } catch {
          try {
            errorBodyText = await responseClone.text()
          } catch {
            errorBodyText = null
          }
          errorMessage = response.statusText || errorBodyText || errorMessage
        }

        const error = new Error(errorMessage) as Error & {
          response: unknown
          status: number
          url: string
        }
        error.response = errorData || {
          error: response.statusText || 'Unknown error',
          body: errorBodyText,
        }
        error.status = response.status
        error.url = request.url

        // 404 em /media é esperado (stub antigo, mídia Evolution indisponível).
        // console.error vira overlay vermelho no Next e o objeto costuma aparecer como {}.
        const quietMediaMiss = response.status === 404 && isMediaFetch(request.url)
        if (!quietMediaMiss) {
          console.error(
            `[ApiClient] ${request.method} ${response.status} ${request.url} — ${errorMessage}`,
          )
        }

        throw error
      },
    ],
  },
})
