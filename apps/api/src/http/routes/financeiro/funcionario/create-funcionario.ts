import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { funcionarioCreateSchema } from '@/services/funcionario.service'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function createFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).post(
    '/organizations/:slug/financeiro/funcionarios',
    {
      schema: {
        tags: ['Financeiro - Funcionários'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        body: funcionarioCreateSchema,
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))
      if (cannot('create', 'Lancamento')) throw new UnauthorizedError('Sem permissão.')

      const id = await app.funcionarioService.create(request.body, organization.id)
      return reply.status(201).send({ id })
    },
  )
}
