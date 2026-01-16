import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { LancamentoService } from '@/services/lancamento.service'

export async function getLancamentosRelatorio(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/lancamentos/relatorio',
      {
        schema: {
          tags: ['Financeiro - Lançamentos'],
          summary: 'Buscar lançamentos para relatório (sem paginação)',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            // Filtros de data
            data_inicio: z.string().optional(),
            data_fim: z.string().optional(),
            conta_bancaria_id: z.string().uuid().optional(),
            categoria_id: z.string().uuid().optional(),
            centro_custo_id: z.string().uuid().optional(),
            parceiro_id: z.string().uuid().optional(),
            tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional(),
            pago: z.string().transform(v => v === 'true').optional(),
          }),
          response: {
            200: z.object({
              lancamentos: z.array(z.any()),
              saldo_anterior: z.number(),
              saldo_final: z.number(),
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

        // Buscar todos os lançamentos sem paginação para o relatório
        const whereFilters: any = {
          filtrar_por: 'data',
          data_inicio: filters.data_inicio,
          data_fim: filters.data_fim,
          conta_bancaria_id: filters.conta_bancaria_id,
          categoria_id: filters.categoria_id,
          centro_custo_id: filters.centro_custo_id,
          parceiro_id: filters.parceiro_id,
          tipo: filters.tipo,
          pago: filters.pago ? 'true' : filters.pago === false ? 'false' : undefined,
          page: 1,
          limit: 10000, // Limite alto para pegar todos
        }

        const result = await LancamentoService.list(organization.id, {
          ...whereFilters,
          orderBy: 'data',
          order: 'asc',
        })
        
        // Calcular saldo anterior (lançamentos antes da data inicial)
        let saldoAnterior = 0
        if (filters.data_inicio) {
          const saldoAnteriorFilters: any = {
            filtrar_por: 'data',
            data_fim: filters.data_inicio,
            conta_bancaria_id: filters.conta_bancaria_id,
            page: 1,
            limit: 10000,
          }
          
          const saldoAnteriorResult = await LancamentoService.list(organization.id, saldoAnteriorFilters)
          
          saldoAnterior = saldoAnteriorResult.lancamentos.reduce((acc: number, lanc: any) => {
            if (lanc.tipo === 'RECEITA') return acc + lanc.valor
            if (lanc.tipo === 'DESPESA') return acc - lanc.valor
            // Transferências não alteram o saldo total
            return acc
          }, 0)
        } else {
          // Se não há data inicial, buscar saldo de todas as contas ou da conta específica
          const saldoAnteriorFilters: any = {
            conta_bancaria_id: filters.conta_bancaria_id,
            page: 1,
            limit: 10000,
          }
          
          const saldoAnteriorResult = await LancamentoService.list(organization.id, saldoAnteriorFilters)
          
          saldoAnterior = saldoAnteriorResult.lancamentos.reduce((acc: number, lanc: any) => {
            if (lanc.tipo === 'RECEITA') return acc + lanc.valor
            if (lanc.tipo === 'DESPESA') return acc - lanc.valor
            return acc
          }, 0)
        }

        // Calcular saldo final
        const saldoFinal = result.lancamentos.reduce((acc: number, lanc: any) => {
          if (lanc.tipo === 'RECEITA') return acc + lanc.valor
          if (lanc.tipo === 'DESPESA') return acc - lanc.valor
          return acc
        }, saldoAnterior)

        return reply.send({
          lancamentos: result.lancamentos,
          saldo_anterior: saldoAnterior,
          saldo_final: saldoFinal,
        })
      },
    )
}
