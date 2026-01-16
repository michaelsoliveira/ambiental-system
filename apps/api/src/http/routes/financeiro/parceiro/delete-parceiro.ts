import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { parceiroSchema } from '@saas/auth'

export async function deleteParceiro(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financeiro/parceiros/:parceiroId',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Deletar parceiro',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), parceiroId: z.string().uuid() }),
          response: { 204: z.null() },
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

        if (cannot('delete', 'Parceiro')) {
          throw new UnauthorizedError('Você não tem permissão para deletar parceiros.')
        }

        const parceiro = await prisma.parceiro.findUnique({
          where: { id: parceiroId, organization_id: organization.id },
        })

        if (!parceiro) {
          throw new BadRequestError('Parceiro não encontrado.')
        }

        await prisma.parceiro.delete({ where: { id: parceiroId } })

        return reply.status(204).send()
      },
    )
}