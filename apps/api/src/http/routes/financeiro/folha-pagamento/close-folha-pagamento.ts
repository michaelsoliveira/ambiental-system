import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function closeFolhaPagamento(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).patch(
    '/organizations/:slug/financeiro/folhas-pagamento/:id/close',
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
      await app.folhaPagamentoService.close(id, organization.id)
      return reply.send({ success: true })
    },
  )
}
