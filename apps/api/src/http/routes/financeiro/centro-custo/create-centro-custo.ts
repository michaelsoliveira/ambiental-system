import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { BadRequestError } from '../../_errors/bad-request-error'
import { centroCustoCreateSchema } from '@/services/centro-custo-service'

export async function createCentroCusto(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/centros-custo',
      {
        schema: {
          tags: ['Financeiro - Centros de Custo'],
          summary: 'Criar novo centro de custo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: centroCustoCreateSchema,
          response: { 201: z.object({ centroCustoId: z.string().uuid() }) },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('create', 'CentroCusto')) {
          throw new UnauthorizedError('Você não tem permissão para criar centros de custo.')
        }

        const existingCodigo = await prisma.centroCusto.findUnique({
          where: {
            organization_id_codigo: {
              organization_id: organization.id,
              codigo: request.body.codigo,
            },
          },
        })

        if (existingCodigo) {
          throw new BadRequestError('Este código de centro de custo já existe.')
        }

        const centroCusto = await prisma.centroCusto.create({
          data: {
            ...request.body,
            organization_id: organization.id,
          },
        })

        return reply.status(201).send({ centroCustoId: centroCusto.id })
      },
    )
}