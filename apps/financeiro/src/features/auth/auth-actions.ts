'use server'

import { env } from '@saas/env/next'
import { redirect } from 'next/navigation'

export async function signInWithGithub() {
  const githubSignInURL = new URL('login/oauth/authorize', 'https://github.com')

  githubSignInURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
  githubSignInURL.searchParams.set(
    'redirect_uri',
    env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
  )
  githubSignInURL.searchParams.set('scope', 'user')

  redirect(githubSignInURL.toString())
}

export async function signInWithOidc() {
  const oidcOn =
    env.AUTH_MODE === 'oidc' || env.NEXT_PUBLIC_AUTH_MODE === 'oidc'
  if (!oidcOn || !env.OIDC_ISSUER || !env.OIDC_CLIENT_ID) {
    throw new Error('SSO OIDC não está configurado neste ambiente.')
  }

  const issuer = env.OIDC_ISSUER.replace(/\/$/, '')
  const redirectUri = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/keycloak`
  const authorize = new URL(`${issuer}/protocol/openid-connect/auth`)
  authorize.searchParams.set('client_id', env.OIDC_CLIENT_ID)
  authorize.searchParams.set('redirect_uri', redirectUri)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('scope', 'openid email profile')

  redirect(authorize.toString())
}