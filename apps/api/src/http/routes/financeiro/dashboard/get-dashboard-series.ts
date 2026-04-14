import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function getDashboardSeries(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/dashboard/series',
    {
      schema: {
        tags: ['Financeiro - Dashboard'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          months: z.coerce.number().int().min(3).max(24).default(12),
          competencia: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { organization } = await request.getUserMembership(slug)
      const { months, competencia } = request.query

      const [series, folha] = await Promise.all([
        app.dashboardFinanceiroService.getSeries(organization.id, months),
        app.dashboardFinanceiroService.getFolhaResumoMes(
          organization.id,
          competencia ?? `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
        ),
      ])

      return reply.send({ ...series, folha_mes: folha })
    },
  )
}
