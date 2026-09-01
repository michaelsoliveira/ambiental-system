import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/** Variáveis do processo da API (Fastify). Não importar no app Next — use `@saas/env/next`. */
export const env = createEnv({
  server: {
    SERVER_PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.string().url(),

    JWT_SECRET: z.string(),

    GITHUB_OAUTH_CLIENT_ID: z.string(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string(),
    GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string().url(),

    /** Evolution API (WhatsApp) — opcional até configurar o canal */
    EVOLUTION_API_BASE_URL: z.string().url().optional(),
    EVOLUTION_API_GLOBAL_KEY: z.string().min(1).optional(),
    /** URL pública da API alcançável pela Evolution (ex.: http://host.docker.internal:3333) */
    EVOLUTION_WEBHOOK_PUBLIC_URL: z.string().url().optional(),
    EVOLUTION_WEBHOOK_SECRET: z.string().optional(),

    /** Redis — BullMQ oc-worker / oc-beat */
    REDIS_URL: z.string().url().optional(),
    OPENAI_API_KEY: z.string().optional(),

    /** E-mail outbound (leads landing) — Resend */
    RESEND_API_KEY: z.string().min(1).optional(),
    /** Aceita `email@dom.com` ou `Nome <email@dom.com>` (header From do Resend) */
    OC_EMAIL_FROM: z
      .string()
      .min(3)
      .refine(
        (v) => {
          const trimmed = v.trim()
          const angle = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
          const addr = angle ? angle[2]?.trim() ?? '' : trimmed
          return z.string().email().safeParse(addr).success
        },
        { message: 'Use email@dom.com ou Nome <email@dom.com>' },
      )
      .optional(),
  },
  client: {},
  shared: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    SERVER_PORT: process.env.SERVER_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    GITHUB_OAUTH_CLIENT_REDIRECT_URI: process.env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
    EVOLUTION_API_BASE_URL: process.env.EVOLUTION_API_BASE_URL,
    EVOLUTION_API_GLOBAL_KEY: process.env.EVOLUTION_API_GLOBAL_KEY,
    EVOLUTION_WEBHOOK_PUBLIC_URL: process.env.EVOLUTION_WEBHOOK_PUBLIC_URL,
    EVOLUTION_WEBHOOK_SECRET: process.env.EVOLUTION_WEBHOOK_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OC_EMAIL_FROM: process.env.OC_EMAIL_FROM,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
})
