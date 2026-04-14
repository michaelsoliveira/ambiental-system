import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function deleteFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).delete(
    '/organizations/:slug/financeiro/funcionarios/:id',
    {
      schema: {
        tags: ['Financeiro - Funcionários'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))
      if (cannot('delete', 'Lancamento')) throw new UnauthorizedError('Sem permissão.')

      const deleted = await app.funcionarioService.delete(id, organization.id)
      if (!deleted) return reply.status(404).send({ message: 'Funcionário não encontrado.' })
      return reply.status(204).send()
    },
  )
}
