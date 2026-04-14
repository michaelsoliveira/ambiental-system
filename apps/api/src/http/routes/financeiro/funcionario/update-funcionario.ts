import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { funcionarioUpdateSchema } from '@/services/funcionario.service'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function updateFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).put(
    '/organizations/:slug/financeiro/funcionarios/:id',
    {
      schema: {
        tags: ['Financeiro - Funcionários'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
        body: funcionarioUpdateSchema,
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))
      if (cannot('update', 'Lancamento')) throw new UnauthorizedError('Sem permissão.')

      const updatedId = await app.funcionarioService.update(id, request.body, organization.id)
      if (!updatedId) return reply.status(404).send({ message: 'Funcionário não encontrado.' })
      return reply.send({ id: updatedId })
    },
  )
}
