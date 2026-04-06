import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

export async function deleteManutencao(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/manutencoes/:manutencaoId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Excluir manutenção e lançamento vinculado',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            veiculoId: z.string().uuid(),
            manutencaoId: z.string().uuid(),
          }),
          response: { 204: z.void() },
        },
      },
      async (request, reply) => {
        const { slug, veiculoId, manutencaoId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('delete', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para excluir manutenções.')
        }

        await FrotaService.excluirManutencao(organization.id, veiculoId, manutencaoId)

        return reply.status(204).send()
      },
    )
}
