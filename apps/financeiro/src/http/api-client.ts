// src/http/api-client.ts (sem 'use server')
import { env } from '@saas/env/next'
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
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          // Tentar obter mensagem de erro mais detalhada
          let errorMessage = `API Error: ${response.status} ${response.statusText}`
          let errorData: any = null
          let errorBodyText: string | null = null
          const responseClone = response.clone()
          
          try {
            errorData = await responseClone.json()
            errorMessage = errorData?.message || errorData?.error || errorMessage
          } catch {
            try {
              errorBodyText = await responseClone.text()
            } catch {
              errorBodyText = null
            }
            // Se não conseguir parsear JSON, usar statusText/body
            errorMessage = response.statusText || errorBodyText || errorMessage
          }
          
          const error: any = new Error(errorMessage)
          error.response = errorData || {
            error: response.statusText || 'Unknown error',
            body: errorBodyText,
          }
          error.status = response.status
          error.url = request.url
          
          // Log do erro para debug
          console.error('[ApiClient] ❌ Erro na requisição:', {
            url: request.url,
            method: request.method,
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            bodyText: errorBodyText,
          })
          
          throw error
        }
      }
    ]
  },
})