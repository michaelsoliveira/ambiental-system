import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function deleteFolhaPagamentoItem(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).delete(
    '/organizations/:slug/financeiro/folhas-pagamento/:id/itens/:itemId',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          id: z.string().uuid(),
          itemId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { slug, id, itemId } = request.params
      const { organization } = await request.getUserMembership(slug)
      await app.folhaPagamentoService.removeItem(id, itemId, organization.id)
      return reply.status(204).send()
    },
  )
}
