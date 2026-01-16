import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { LancamentoService } from '@/services/lancamento.service'

export async function getLancamentoStatistics(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/lancamentos/statistics',
      {
        schema: {
          tags: ['Financeiro - Lançamentos'],
          summary: 'Obter estatísticas de lançamentos',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            // Mesmos filtros da listagem, exceto paginação
            search: z.string().optional(),
            tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA', 'todos']).optional(),
            status: z.enum(['PENDENTE', 'CONFIRMADO', 'PAGO', 'CANCELADO', 'ATRASADO', 'todos']).optional(),
            pago: z.enum(['true', 'false', 'todos']).optional(),
            filtrar_por: z.enum(['data', 'data_vencimento', 'data_pagamento']).optional(),
            data_inicio: z.string().optional(),
            data_fim: z.string().optional(),
            categoria_id: z.string().uuid().optional(),
            conta_bancaria_id: z.string().uuid().optional(),
            centro_custo_id: z.string().uuid().optional(),
            parceiro_id: z.string().uuid().optional(),
            forma_parcelamento: z.enum(['UNICA', 'FIXA', 'PROGRESSIVA', 'todos']).optional(),
            valor_min: z.string().optional(),
            valor_max: z.string().optional(),
            apenas_vencidos: z.string().transform(v => v === 'true').optional(),
            apenas_a_vencer: z.string().transform(v => v === 'true').optional(),
          }),
          response: {
            200: z.object({
              total_receitas: z.number(),
              total_despesas: z.number(),
              saldo: z.number(),
              total_pendentes: z.number(),
              total_pagos: z.number(),
            }),
            403: z.object({ error: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const filters = request.query
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar lançamentos.')
        }

        const statistics = await LancamentoService.getStatistics(organization.id, filters)

        return reply.send(statistics)
      },
    )
}