import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { folhaCreateSchema } from '@/services/folha-pagamento.service'

export async function createFolhaPagamento(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).post(
    '/organizations/:slug/financeiro/folhas-pagamento',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        body: folhaCreateSchema,
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { organization } = await request.getUserMembership(slug)
      const id = await app.folhaPagamentoService.create(request.body, organization.id)
      return reply.status(201).send({ id })
    },
  )
}
