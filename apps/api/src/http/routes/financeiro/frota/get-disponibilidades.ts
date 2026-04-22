import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

export async function getDisponibilidades(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/disponibilidades',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Listar agenda de disponibilidade do veículo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          querystring: z.object({
            inicio: z.string().optional(),
            fim: z.string().optional(),
          }),
          response: { 200: z.array(z.any()) },
        },
      },
      async (request, reply) => {
        const { slug, veiculoId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )
        if (cannot('get', 'Lancamento')) {
          throw new UnauthorizedError(
            'Você não tem permissão para visualizar a agenda de disponibilidade.',
          )
        }

        const inicio = request.query.inicio ? new Date(request.query.inicio) : null
        const fim = request.query.fim ? new Date(request.query.fim) : null

        const rows = await FrotaService.listarDisponibilidades(
          organization.id,
          veiculoId,
          { inicio, fim },
        )

        return reply.send(rows)
      },
    )
}
