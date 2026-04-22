import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

const bodySchema = z.object({
  tipo: z.enum(['PRODUCAO', 'MANUTENCAO']),
  inicio: z.string().min(1),
  fim: z.string().min(1),
  motivo: z.string().max(500).optional().nullable(),
})

export async function putDisponibilidade(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/disponibilidades/:disponibilidadeId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Atualizar disponibilidade do veículo',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            veiculoId: z.string().uuid(),
            disponibilidadeId: z.string().uuid(),
          }),
          body: bodySchema,
          response: { 204: z.void() },
        },
      },
      async (request, reply) => {
        const { slug, veiculoId, disponibilidadeId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )
        if (cannot('update', 'Lancamento')) {
          throw new UnauthorizedError(
            'Você não tem permissão para atualizar disponibilidade.',
          )
        }

        await FrotaService.atualizarDisponibilidade(
          organization.id,
          veiculoId,
          disponibilidadeId,
          {
            tipo: request.body.tipo,
            inicio: new Date(request.body.inicio),
            fim: new Date(request.body.fim),
            motivo: request.body.motivo ?? null,
          },
        )

        return reply.status(204).send()
      },
    )
}
