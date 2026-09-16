/** Dual-mode: local (standalone) | oidc (SSO Keycloak). Default local. */
export function isOidcAuthMode(): boolean {
  const mode = (
    process.env.NEXT_PUBLIC_AUTH_MODE ||
    process.env.AUTH_MODE ||
    'local'
  ).toLowerCase()
  return mode === 'oidc'
}

export function isLocalAuthFallback(): boolean {
  const v = (
    process.env.NEXT_PUBLIC_AUTH_LOCAL_FALLBACK ||
    process.env.AUTH_LOCAL_FALLBACK ||
    'true'
  ).toLowerCase()
  return v !== 'false' && v !== '0'
}

export function keycloakClientEnv() {
  const clientId = process.env.AUTH_KEYCLOAK_ID || process.env.OIDC_CLIENT_ID
  const clientSecret =
    process.env.AUTH_KEYCLOAK_SECRET || process.env.OIDC_CLIENT_SECRET
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER || process.env.OIDC_ISSUER
  return { clientId, clientSecret, issuer }
}

export function isKeycloakConfigured(): boolean {
  const { clientId, clientSecret, issuer } = keycloakClientEnv()
  return Boolean(isOidcAuthMode() && clientId && clientSecret && issuer)
}
