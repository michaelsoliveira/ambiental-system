import { env } from '@saas/env/next'

/** Base pública da API (ky já usa o mesmo valor como prefixUrl). */
export function getPublicApiUrl(): string {
  const raw = (env.NEXT_PUBLIC_API_URL || '').trim()
  if (!raw) {
    return typeof window !== 'undefined' ? '' : ''
  }
  return raw.replace(/\/$/, '')
}
