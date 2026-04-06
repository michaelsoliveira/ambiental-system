import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function deleteVeiculo(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Remover veículo (e registros operacionais em cascata)',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          response: { 204: z.null() },
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

        if (cannot('delete', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para excluir veículos.')
        }

        const existing = await prisma.veiculo.findFirst({
          where: { id: veiculoId, organization_id: organization.id },
        })
        if (!existing) {
          throw new BadRequestError('Veículo não encontrado.')
        }

        await prisma.veiculo.delete({ where: { id: veiculoId } })

        return reply.status(204).send()
      },
    )
}
