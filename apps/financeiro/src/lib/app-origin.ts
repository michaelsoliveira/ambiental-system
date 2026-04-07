import type { NextRequest } from 'next/server'

/**
 * Hostnames que não devem virar URL pública (bind do Node no container).
 */
function isUnusablePublicHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, '')
  return h === '0.0.0.0' || h === '::' || h === '*'
}

/**
 * URL pública do app (HTTPS + domínio real) atrás de proxy.
 * Evita https://0.0.0.0:3000 quando HOSTNAME/PORT são os do container.
 *
 * `APP_URL` é lido em runtime (não é NEXT_PUBLIC) — use no Docker sem rebuild.
 */
export function getAppOrigin(request: NextRequest): string {
  const fromEnv =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }

  const forwardedProto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'https'

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim()
    return `${forwardedProto}://${host}`
  }

  const rawHost = request.headers.get('host')
  if (rawHost) {
    const hostOnly = rawHost.split(',')[0].trim().split(':')[0]
    if (!isUnusablePublicHost(hostOnly)) {
      return `${forwardedProto}://${rawHost.split(',')[0].trim()}`
    }
  }

  const { hostname } = request.nextUrl
  if (!isUnusablePublicHost(hostname)) {
    return request.nextUrl.origin
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  throw new Error(
    'Defina APP_URL ou NEXT_PUBLIC_APP_URL (build) ou configure X-Forwarded-Host / Host no proxy.',
  )
}
