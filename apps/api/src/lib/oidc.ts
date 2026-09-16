import { createPublicKey, randomBytes } from 'node:crypto'
import { createHash } from 'node:crypto'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { env } from '@saas/env'
import { prisma } from '@/lib/prisma'

type Jwk = JsonWebKey & { kid?: string }

let cache: { keys: Jwk[]; exp: number } | null = null

export function oidcEnabled(): boolean {
  return env.AUTH_MODE === 'oidc' && Boolean(env.OIDC_ISSUER)
}

export function localFallbackEnabled(): boolean {
  return env.AUTH_LOCAL_FALLBACK !== 'false' && env.AUTH_LOCAL_FALLBACK !== '0'
}

export function jitProvisionEnabled(): boolean {
  return env.OIDC_JIT_PROVISION !== 'false' && env.OIDC_JIT_PROVISION !== '0'
}

async function pemForKid(kid: string): Promise<string> {
  const issuer = (env.OIDC_ISSUER || '').replace(/\/$/, '')
  const jwksUrl = env.OIDC_JWKS_URL || `${issuer}/protocol/openid-connect/certs`
  const now = Date.now()
  if (!cache || cache.exp < now) {
    const res = await fetch(jwksUrl)
    if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`)
    const body = (await res.json()) as { keys: Jwk[] }
    cache = { keys: body.keys || [], exp: now + 3_600_000 }
  }
  const jwk = cache.keys.find((k) => k.kid === kid)
  if (!jwk) {
    cache = null
    throw new Error(`Unknown OIDC kid: ${kid}`)
  }
  return createPublicKey({ key: jwk, format: 'jwk' }).export({
    type: 'spki',
    format: 'pem',
  }) as string
}

export async function verifyOidcToken(token: string): Promise<JwtPayload> {
  const issuer = (env.OIDC_ISSUER || '').replace(/\/$/, '')
  const audience = env.OIDC_AUDIENCE?.trim() || undefined
  const header = JSON.parse(
    Buffer.from(token.split('.')[0], 'base64url').toString('utf8'),
  ) as { kid?: string }
  if (!header.kid) throw new Error('OIDC token missing kid')
  const pem = await pemForKid(header.kid)
  return jwt.verify(token, pem, {
    algorithms: ['RS256'],
    issuer,
    ...(audience ? { audience } : {}),
  }) as JwtPayload
}

function placeholderPassword(): string {
  return createHash('sha256').update(randomBytes(32)).digest('hex')
}

export async function resolveOidcLocalUserId(payload: JwtPayload): Promise<string> {
  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  const email = String(payload.email || payload.preferred_username || '')
    .trim()
    .toLowerCase()
  if (!sub && !email) {
    throw new Error('OIDC payload missing sub/email')
  }

  let user =
    (sub
      ? await prisma.user.findFirst({ where: { provider_id: sub } })
      : null) ??
    (email ? await prisma.user.findUnique({ where: { email } }) : null)

  if (user && sub && user.provider_id !== sub) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { provider: 'oidc', provider_id: sub },
    })
  }

  if (!user) {
    if (!jitProvisionEnabled() || !email) {
      throw new Error('OIDC user not provisioned')
    }
    const base = (email.split('@')[0] || 'user').slice(0, 40)
    let username = base
    let n = 0
    while (await prisma.user.findFirst({ where: { username } })) {
      n += 1
      username = `${base}-${n}`
    }
    user = await prisma.user.create({
      data: {
        email,
        username,
        provider: 'oidc',
        provider_id: sub || null,
        password: placeholderPassword(),
      },
    })
  }

  return user.id
}
