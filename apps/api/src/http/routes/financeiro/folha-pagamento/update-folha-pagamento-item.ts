import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { folhaItemCreateSchema } from '@/services/folha-pagamento.service'

export async function updateFolhaPagamentoItem(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).patch(
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
        body: folhaItemCreateSchema,
      },
    },
    async (request, reply) => {
      const { slug, id, itemId } = request.params
      const { organization } = await request.getUserMembership(slug)
      await app.folhaPagamentoService.updateItem(id, itemId, request.body, organization.id)
      return reply.send({ success: true })
    },
  )
}
