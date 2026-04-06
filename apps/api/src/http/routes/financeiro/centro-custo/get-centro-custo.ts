import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getCentroCusto(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/centros-custo/:centroId',
      {
        schema: {
          tags: ['Financeiro - Centros de Custo'],
          summary: 'Obter detalhes de um centro de custo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), centroId: z.string().uuid() }),
          response: { 200: z.any() },
        },
      },
      async (request, reply) => {
        const { slug, centroId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'CentroCusto')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar esta conta.')
        }

        const centroCusto = await prisma.centroCusto.findUnique({
          where: { id: centroId, organization_id: organization.id },
        })

        if (!centroCusto) {
          throw new BadRequestError('Centro de Custo não encontrada.')
        }

        return reply.send({ centroCusto })
      },
    )
}