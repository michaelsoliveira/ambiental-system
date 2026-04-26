import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getRubricasFolha(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/folhas-pagamento/rubricas',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          tipo_folha: z.enum(['FOLHA_MENSAL', 'FERIAS', 'DECIMO_TERCEIRO', 'RESCISAO']).optional(),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))
      if (cannot('get', 'Lancamento')) throw new UnauthorizedError('Sem permissão.')

      const rubricas = await app.folhaPagamentoService.listRubricas(organization.id, request.query)
      return reply.send({ rubricas })
    },
  )
}
