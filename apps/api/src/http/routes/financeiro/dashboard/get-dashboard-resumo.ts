import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

const folhaStatusRelatorioSchema = z.enum(['TODAS', 'PAGA', 'FECHADA', 'ABERTA', 'CANCELADA'])

export async function getDashboardResumo(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/dashboard/resumo',
    {
      schema: {
        tags: ['Financeiro - Dashboard'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          competencia: z.string().optional(),
          folha_status: folhaStatusRelatorioSchema.optional().default('TODAS'),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { competencia, folha_status } = request.query
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))
      if (cannot('get', 'Lancamento')) throw new UnauthorizedError('Sem permissão.')

      const result = await app.dashboardFinanceiroService.getResumo(organization.id, {
        competencia,
        folha_status: folha_status,
      })
      return reply.send(result)
    },
  )
}
