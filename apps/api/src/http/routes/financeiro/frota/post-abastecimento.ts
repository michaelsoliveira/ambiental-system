import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

const bodySchema = z.object({
  data: z.string().min(1),
  litros: z.number().positive(),
  valor: z.number().positive(),
  km: z.number().optional().nullable(),
  categoriaId: z.string().uuid(),
  contaBancariaId: z.string().uuid(),
  centroCustoId: z.string().uuid().optional().nullable(),
  pago: z.boolean().optional().default(false),
})

export async function postAbastecimento(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/abastecimentos',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Registrar abastecimento (cria lançamento de despesa)',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          body: bodySchema,
          response: {
            201: z.object({
              abastecimentoId: z.string().uuid(),
              lancamentoId: z.string().uuid(),
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
          throw new UnauthorizedError('Você não tem permissão para registrar abastecimentos.')
        }

        const b = request.body
        const result = await FrotaService.registrarAbastecimento(organization.id, {
          veiculoId,
          data: new Date(b.data),
          litros: b.litros,
          valor: b.valor,
          km: b.km ?? null,
          categoriaId: b.categoriaId,
          contaBancariaId: b.contaBancariaId,
          centroCustoId: b.centroCustoId ?? null,
          pago: b.pago,
        })

        return reply.status(201).send({
          abastecimentoId: result.abastecimento.id,
          lancamentoId: result.lancamentoId,
        })
      },
    )
}
