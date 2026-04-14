import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function getFolhaPagamento(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/folhas-pagamento/:id',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      const folha = await app.folhaPagamentoService.getById(id, organization.id)
      if (!folha) return reply.status(404).send({ message: 'Folha não encontrada.' })
      return reply.send(folha)
    },
  )
}
