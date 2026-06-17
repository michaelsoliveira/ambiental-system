import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

function toDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError('Data inválida.')
  }

  return date
}

const bodySchema = z.object({
  origem: z.string().min(1).max(500),
  destino: z.string().min(1).max(500),
  dataInicio: z.string().min(1),
  dataFim: z.string().optional().nullable(),
  kmRodado: z.number().optional().nullable(),
  valorReceita: z.number().nonnegative().optional().nullable(),
  categoriaId: z.string().uuid().optional().nullable(),
  contaBancariaId: z.string().uuid().optional().nullable(),
  centroCustoId: z.string().uuid().optional().nullable(),
  pago: z.boolean().optional().default(false),
})

export async function putViagem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/viagens/:viagemId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Atualizar viagem e lançamento de receita (se houver)',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            veiculoId: z.string().uuid(),
            viagemId: z.string().uuid(),
          }),
          body: bodySchema,
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

        if (cannot('update', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para editar viagens.')
        }

        const b = request.body
        const dataInicio = toDate(b.dataInicio)
        const dataFim = b.dataFim ? toDate(b.dataFim) : null

        await FrotaService.atualizarViagem(organization.id, veiculoId, viagemId, {
          origem: b.origem,
          destino: b.destino,
          dataInicio,
          dataFim,
          kmRodado: b.kmRodado ?? null,
          valorReceita: b.valorReceita ?? null,
          categoriaId: b.categoriaId ?? undefined,
          contaBancariaId: b.contaBancariaId ?? undefined,
          centroCustoId: b.centroCustoId ?? null,
          pago: b.pago,
        })

        return reply.status(204).send()
      },
    )
}
