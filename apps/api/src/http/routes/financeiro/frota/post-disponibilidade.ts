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

export async function postDisponibilidade(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/disponibilidades',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Criar disponibilidade do veículo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          body: bodySchema,
          response: {
            201: z.object({ disponibilidadeId: z.string().uuid() }),
          },
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
        if (cannot('create', 'Lancamento')) {
          throw new UnauthorizedError(
            'Você não tem permissão para criar disponibilidade do veículo.',
          )
        }

        const row = await FrotaService.criarDisponibilidade(organization.id, {
          veiculoId,
          tipo: request.body.tipo,
          inicio: new Date(request.body.inicio),
          fim: new Date(request.body.fim),
          motivo: request.body.motivo ?? null,
          origem: 'MANUAL',
        })

        return reply.status(201).send({ disponibilidadeId: row.id })
      },
    )
}
