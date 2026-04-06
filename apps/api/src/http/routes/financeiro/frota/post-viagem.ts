import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

const bodySchema = z.object({
  origem: z.string().min(1).max(500),
  destino: z.string().min(1).max(500),
  dataInicio: z.string().min(1),
  dataFim: z.string().optional().nullable(),
  kmRodado: z.number().optional().nullable(),
  valorReceita: z.number().positive().optional().nullable(),
  categoriaId: z.string().uuid().optional().nullable(),
  contaBancariaId: z.string().uuid().optional().nullable(),
  centroCustoId: z.string().uuid().optional().nullable(),
  pago: z.boolean().optional().default(false),
})

export async function postViagem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/viagens',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Registrar viagem (opcionalmente receita / frete)',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          body: bodySchema,
          response: {
            201: z.object({
              viagemId: z.string().uuid(),
              lancamentoId: z.string().uuid().nullable(),
            }),
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
          throw new UnauthorizedError('Você não tem permissão para registrar viagens.')
        }

        const b = request.body
        const result = await FrotaService.registrarViagemComReceita(organization.id, {
          veiculoId,
          origem: b.origem,
          destino: b.destino,
          dataInicio: new Date(b.dataInicio),
          dataFim: b.dataFim ? new Date(b.dataFim) : null,
          kmRodado: b.kmRodado ?? null,
          valorReceita: b.valorReceita ?? null,
          categoriaId: b.categoriaId ?? undefined,
          contaBancariaId: b.contaBancariaId ?? undefined,
          centroCustoId: b.centroCustoId ?? null,
          pago: b.pago,
        })

        return reply.status(201).send({
          viagemId: result.viagem.id,
          lancamentoId: result.lancamentoId,
        })
      },
    )
}
