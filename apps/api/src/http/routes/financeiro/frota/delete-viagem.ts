import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

export async function deleteViagem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/viagens/:viagemId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Excluir viagem e lançamento de receita (se houver)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            veiculoId: z.string().uuid(),
            viagemId: z.string().uuid(),
          }),
          response: { 204: z.void() },
        },
      },
      async (request, reply) => {
        const { slug, veiculoId, viagemId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('delete', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para excluir viagens.')
        }

        await FrotaService.excluirViagem(organization.id, veiculoId, viagemId)

        return reply.status(204).send()
      },
    )
}
