import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

const bodySchema = z.object({
  tipo: z.string().min(1).max(100),
  descricao: z.string().optional().nullable(),
  data: z.string().min(1),
  valor: z.number().positive(),
  categoriaId: z.string().uuid(),
  contaBancariaId: z.string().uuid(),
  centroCustoId: z.string().uuid().optional().nullable(),
  pago: z.boolean().optional().default(false),
})

export async function putManutencao(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/manutencoes/:manutencaoId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Atualizar manutenção e lançamento vinculado',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            veiculoId: z.string().uuid(),
            manutencaoId: z.string().uuid(),
          }),
          body: bodySchema,
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

        if (cannot('update', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para editar manutenções.')
        }

        const b = request.body
        await FrotaService.atualizarManutencao(organization.id, veiculoId, manutencaoId, {
          tipo: b.tipo,
          descricao: b.descricao ?? null,
          data: new Date(b.data),
          valor: b.valor,
          categoriaId: b.categoriaId,
          contaBancariaId: b.contaBancariaId,
          centroCustoId: b.centroCustoId ?? null,
          pago: b.pago,
        })

        return reply.status(204).send()
      },
    )
}
