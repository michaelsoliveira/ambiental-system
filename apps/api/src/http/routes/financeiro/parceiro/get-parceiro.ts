import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getParceiro(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/parceiros/:parceiroId',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Obter detalhes de um parceiro',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), parceiroId: z.string().uuid() }),
          response: {
            200: z.object({
              parceiro: z.object({
                id: z.string().uuid(),
                tipo_parceiro: z.string(),
                pessoa_id: z.string().uuid(),
                observacoes: z.string().nullable(),
                ativo: z.boolean(),
                created_at: z.date(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, parceiroId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'Parceiro')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar este parceiro.')
        }

        const parceiro = await prisma.parceiro.findUnique({
          where: {
            id: parceiroId,
            organization_id: organization.id,
          },
        })

        if (!parceiro) {
          throw new BadRequestError('Parceiro não encontrado.')
        }

        return reply.send({ parceiro })
      },
    )
}