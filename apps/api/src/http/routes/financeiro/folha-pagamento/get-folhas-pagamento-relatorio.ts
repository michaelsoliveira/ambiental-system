import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getFolhasPagamentoRelatorio(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/folhas-pagamento/relatorio',
    {
      schema: {
        tags: ['Financeiro - Folha de Pagamento'],
        summary: 'Buscar relatório completo da folha de pagamento',
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          competencia: z.string().regex(/^\d{2}\/\d{4}$/).optional(),
          tipo: z.enum(['FOLHA_MENSAL', 'FERIAS', 'DECIMO_TERCEIRO', 'RESCISAO']).optional(),
          status: z.enum(['ABERTA', 'FECHADA', 'PAGA', 'CANCELADA']).optional(),
          funcionario_id: z.string().uuid().optional(),
          rubrica_id: z.string().uuid().optional(),
          natureza: z.enum(['PROVENTO', 'DESCONTO', 'ENCARGO']).optional(),
          data_fechamento_inicio: z.string().optional(),
          data_fechamento_fim: z.string().optional(),
          data_pagamento_inicio: z.string().optional(),
          data_pagamento_fim: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))
      if (cannot('get', 'Lancamento')) throw new UnauthorizedError('Sem permissão.')

      const relatorio = await app.folhaPagamentoService.getRelatorio(organization.id, request.query)
      return reply.send(relatorio)
    },
  )
}
