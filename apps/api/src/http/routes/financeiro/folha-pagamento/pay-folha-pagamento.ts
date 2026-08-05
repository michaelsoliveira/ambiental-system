import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { folhaPaySchema } from '@/services/folha-pagamento.service'

export async function payFolhaPagamento(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).patch(
    '/organizations/:slug/financeiro/folhas-pagamento/:id/pay',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
        body: folhaPaySchema,
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      const result = await app.folhaPagamentoService.markAsPaid(
        id,
        organization.id,
        request.body,
      )
      return reply.send({ success: true, lancamentoId: result.lancamentoId })
    },
  )
}
