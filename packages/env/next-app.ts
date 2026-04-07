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
  },
  client: {},
  shared: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    GITHUB_OAUTH_CLIENT_REDIRECT_URI: process.env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === '1' || isNextProductionBuild,
})
