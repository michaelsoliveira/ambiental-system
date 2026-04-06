import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { centroCustoUpdateSchema } from '@/services/centro-custo-service'

export async function updateCentroCusto(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/centros-custo/:centroId',
      {
        schema: {
          tags: ['Financeiro - Centros de Custo'],
          summary: 'Atualizar centro de custo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), centroId: z.string().uuid() }),
          body: centroCustoUpdateSchema,
          response: { 204: z.null() },
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

        if (cannot('update', 'CentroCusto')) {
          throw new UnauthorizedError('Você não tem permissão para atualizar centros de custo.')
        }

        const centro = await prisma.centroCusto.findUnique({
          where: { id: centroId, organization_id: organization.id },
        })

        if (!centro) {
          throw new BadRequestError('Centro de custo não encontrado.')
        }

        await prisma.centroCusto.update({
          where: { id: centroId },
          data: request.body,
        })

        return reply.status(204).send()
      },
    )
}