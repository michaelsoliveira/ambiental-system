import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { BadRequestError } from '../../_errors/bad-request-error'
import { contaBancariaCreateSchema } from '@/services/conta-bancaria-service'

export async function createContaBancaria(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/contas',
      {
        schema: {
          tags: ['Financeiro - Contas Bancárias'],
          summary: 'Criar nova conta bancária',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: contaBancariaCreateSchema,
          response: { 201: z.object({ contaBancariaId: z.string().uuid() }) },
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

        if (cannot('create', 'ContaBancaria')) {
          throw new UnauthorizedError('Você não tem permissão para criar contas bancárias.')
        }

        const existingCodigo = await prisma.contaBancaria.findUnique({
          where: {
            organization_id_codigo: {
              organization_id: organization.id,
              codigo: request.body.codigo,
            },
          },
        })

        if (existingCodigo) {
          throw new BadRequestError('Este código de conta já existe.')
        }

        try {
          const contaBancariaId = await app.contaBancariaService.createContaBancaria({
              ...request.body,
          },
            organization.id,
          )

          return reply.status(201).send({ contaBancariaId: contaBancariaId })
        } catch (error) {
          if (error instanceof Error) {
            throw new BadRequestError(error.message)
          }
          throw new BadRequestError('Erro ao criar conta.')
        }
      },
    )
}