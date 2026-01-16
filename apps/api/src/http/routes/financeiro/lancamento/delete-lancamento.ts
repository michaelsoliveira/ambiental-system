import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { LancamentoService } from '@/services/lancamento.service'

export async function deleteLancamento(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financeiro/lancamentos/:lancamentoId',
      {
        schema: {
          tags: ['Financeiro - Lançamentos'],
          summary: 'Deletar lançamento',
          security: [{ bearerAuth: [] }],
          params: z.object({ 
            slug: z.string(), 
            lancamentoId: z.string().uuid() 
          }),
          response: {
            204: z.null(),
            400: z.object({ error: z.string() }),
            403: z.object({ error: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const { slug, lancamentoId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('delete', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para deletar lançamentos.')
        }

        await LancamentoService.delete(lancamentoId, organization.id)

        return reply.status(204).send()
      },
    )
}