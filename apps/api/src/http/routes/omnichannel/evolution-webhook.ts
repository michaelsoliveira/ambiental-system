import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createHmac, timingSafeEqual } from 'node:crypto'

import { omnichannelService } from '@/services/omnichannel/omnichannel.service'

function validateSignature(
  bodyBytes: Buffer,
  signatureHeader: string | undefined,
): boolean {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET?.trim()
  if (!secret) return true
  if (!signatureHeader) return false
  const expected = createHmac('sha256', secret).update(bodyBytes).digest('hex')
  const received = signatureHeader.replace(/^sha256=/, '')
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(received)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

type WebhookRequest = {
  body: unknown
  headers: Record<string, string | string[] | undefined>
  rawBody?: Buffer
}

/**
 * Webhook público da Evolution API.
 * Configure na instância: POST {EVOLUTION_WEBHOOK_PUBLIC_URL}/webhooks/evolution
 *
 * Com webhookByEvents=true a Evolution posta em /webhooks/evolution/{event-slug}.
 */
export async function evolutionWebhookRoutes(app: FastifyInstance) {
  const handler = async (request: WebhookRequest) => {
    const signature = request.headers?.['x-evolution-signature']
    const sig =
      typeof signature === 'string'
        ? signature
        : Array.isArray(signature)
          ? signature[0]
          : undefined

    const raw =
      request.rawBody ??
      Buffer.from(
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body ?? {}),
      )

    if (!validateSignature(raw, sig)) {
      console.warn(
        '[evolution webhook] assinatura inválida — configure EVOLUTION_WEBHOOK_SECRET se necessário',
      )
      return { ok: false, detail: 'invalid_signature' }
    }

    const body =
      request.body && typeof request.body === 'object'
        ? (request.body as Record<string, unknown>)
        : {}

    try {
      return await omnichannelService.handleEvolutionWebhook(body)
    } catch (err) {
      console.error('[evolution webhook] erro:', err)
      return { ok: false, detail: 'processing_error' }
    }
  }

  function toWebhookRequest(
    request: {
      body: unknown
      headers: Record<string, string | string[] | undefined>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawBody?: any
    },
    bodyOverride?: Record<string, unknown>,
  ): WebhookRequest {
    // NÃO espalhar o Fastify Request — headers/rawBody são getters e somem no spread.
    return {
      body: bodyOverride ?? request.body,
      headers: request.headers ?? {},
      rawBody:
        request.rawBody instanceof Buffer ? request.rawBody : undefined,
    }
  }

  app.withTypeProvider<ZodTypeProvider>().post(
    '/webhooks/evolution',
    {
      schema: {
        tags: ['Webhooks'],
        summary: 'Webhook Evolution API (WhatsApp)',
        body: z.record(z.string(), z.unknown()).or(z.any()),
        response: { 200: z.any() },
      },
    },
    async (request) => handler(toWebhookRequest(request)),
  )

  app.withTypeProvider<ZodTypeProvider>().post(
    '/webhooks/evolution/:eventSlug',
    {
      schema: {
        tags: ['Webhooks'],
        summary: 'Webhook Evolution API por evento (byEvents)',
        params: z.object({ eventSlug: z.string() }),
        body: z.record(z.string(), z.unknown()).or(z.any()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const body =
        request.body && typeof request.body === 'object'
          ? { ...(request.body as Record<string, unknown>) }
          : {}
      if (!body.event && request.params.eventSlug) {
        // messages-upsert → messages.upsert | MESSAGES_UPSERT → messages.upsert
        const slug = request.params.eventSlug
        body.event = slug.includes('_')
          ? slug.toLowerCase().replace(/_/g, '.')
          : slug.replace(/-/g, '.')
      }
      return handler(toWebhookRequest(request, body))
    },
  )
}
