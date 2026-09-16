import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const isNextProductionBuild =
  process.env.NEXT_PHASE === 'phase-production-build'

/**
 * Env para apps Next (ex.: financeiro): API pública + OAuth GitHub no servidor.
 * Sem DATABASE_URL/JWT — isso fica só no processo da API (`@saas/env` default → api.ts).
 */
export const env = createEnv({
  server: {
    GITHUB_OAUTH_CLIENT_ID: z.string(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string(),
    GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string().url(),
    AUTH_MODE: z.enum(['local', 'oidc']).default('local'),
    OIDC_ISSUER: z.string().url().optional(),
    OIDC_CLIENT_ID: z.string().optional(),
    OIDC_CLIENT_SECRET: z.string().optional(),
    OIDC_AUDIENCE: z.string().optional(),
  },
  client: {},
  shared: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_AUTH_MODE: z.enum(['local', 'oidc']).default('local'),
    NEXT_PUBLIC_AUTH_LOCAL_FALLBACK: z.enum(['true', 'false']).default('true'),
  },
  runtimeEnv: {
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    GITHUB_OAUTH_CLIENT_REDIRECT_URI: process.env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
    AUTH_MODE: process.env.AUTH_MODE,
    OIDC_ISSUER: process.env.OIDC_ISSUER,
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
    OIDC_AUDIENCE: process.env.OIDC_AUDIENCE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE,
    NEXT_PUBLIC_AUTH_LOCAL_FALLBACK: process.env.NEXT_PUBLIC_AUTH_LOCAL_FALLBACK,
  },
  emptyStringAsUndefined: true,
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === '1' || isNextProductionBuild,
})
