import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { parceiroSchema } from '@saas/auth'

export async function deleteContaBancaria(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financeiro/contas/:contaId',
      {
        schema: {
          tags: ['Financeiro - Contas Bancárias'],
          summary: 'Deletar conta bancária',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), contaId: z.string().uuid() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, contaId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('delete', 'ContaBancaria')) {
          throw new UnauthorizedError('Você não tem permissão para deletar contas bancárias.')
        }

        const conta = await prisma.contaBancaria.findUnique({
          where: { id: contaId, organization_id: organization.id },
        })

        if (!conta) {
          throw new BadRequestError('Conta bancária não encontrada.')
        }

        await prisma.contaBancaria.delete({ where: { id: contaId } })

        return reply.status(204).send()
      },
    )
}