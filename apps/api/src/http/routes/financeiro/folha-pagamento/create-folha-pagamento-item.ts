import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { folhaItemCreateSchema } from '@/services/folha-pagamento.service'

export async function createFolhaPagamentoItem(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).post(
    '/organizations/:slug/financeiro/folhas-pagamento/:id/itens',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
        body: folhaItemCreateSchema,
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      await app.folhaPagamentoService.addItem(id, request.body, organization.id)
      return reply.status(201).send({ success: true })
    },
  )
}
