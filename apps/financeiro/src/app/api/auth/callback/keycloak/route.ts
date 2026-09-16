import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { env } from '@saas/env/next'
import { getAppOrigin } from '@/lib/app-origin'
import { acceptInvite } from '@/http/accept-invite'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = getAppOrigin(request)

  const oidcOn =
    env.AUTH_MODE === 'oidc' || env.NEXT_PUBLIC_AUTH_MODE === 'oidc'
  if (!code || !oidcOn || !env.OIDC_ISSUER || !env.OIDC_CLIENT_ID) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=oidc', origin))
  }

  const issuer = env.OIDC_ISSUER.replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/keycloak`
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: env.OIDC_CLIENT_ID,
  })
  if (env.OIDC_CLIENT_SECRET) {
    body.set('client_secret', env.OIDC_CLIENT_SECRET)
  }

  const tokenRes = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const tokenData = (await tokenRes.json()) as {
    access_token?: string
    error?: string
  }

  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=oidc', origin))
  }

  const cookie = await cookies()
  cookie.set('token', tokenData.access_token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  const inviteId = cookie.get('inviteId')?.value
  if (inviteId) {
    try {
      await acceptInvite(inviteId)
      cookie.delete('inviteId')
    } catch {}
  }

  return NextResponse.redirect(new URL('/', origin))
}
