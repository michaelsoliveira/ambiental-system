import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { omnichannelService } from '@/services/omnichannel/omnichannel.service'

const contatoBodySchema = z.object({
  nome: z.string().min(2),
  empresa: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().min(8),
  servico: z.string().min(1),
  mensagem: z.string().min(10),
})

/**
 * Endpoint público consumido pela ambiental-landing (`/api/contato` → proxy).
 * Autenticação: header `X-Landing-Ingest-Secret` (secret do canal landing_form).
 */
export async function postPublicLandingContato(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/public/landing/:slug/contato',
    {
      schema: {
        tags: ['Landing', 'Omnichannel'],
        summary: 'Receber lead do formulário da landing no omnichannel',
        params: z.object({ slug: z.string() }),
        headers: z
          .object({
            'x-landing-ingest-secret': z.string().optional(),
          })
          .passthrough(),
        body: contatoBodySchema,
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const secret =
        request.headers['x-landing-ingest-secret'] ??
        (typeof request.headers.authorization === 'string' &&
        request.headers.authorization.startsWith('Bearer ')
          ? request.headers.authorization.slice(7)
          : undefined)

      const result = await omnichannelService.ingestLandingContato(
        request.params.slug,
        secret,
        request.body,
      )
      return reply.status(201).send(result)
    },
  )
}
