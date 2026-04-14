import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getFuncionarios(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/funcionarios',
    {
      schema: {
        tags: ['Financeiro - Funcionários'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(50),
          search: z.string().optional(),
          ativo: z.coerce.boolean().optional(),
          empresa_id: z.string().uuid().optional(),
          cargo_id: z.string().uuid().optional(),
          tipo_contrato: z.enum(['CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO', 'APRENDIZ']).optional(),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const userId = await request.getCurrentUserId()
      const { organization, membership } = await request.getUserMembership(slug)
      const { cannot } = getUserPermissions(
        userId,
        membership.members_roles.map((mr: any) => mr.roles.name),
      )
      if (cannot('get', 'Lancamento')) {
        throw new UnauthorizedError('Você não tem permissão para listar funcionários.')
      }

      const result = await app.funcionarioService.list(organization.id, request.query)
      return reply.send({ funcionarios: result.data, pagination: result.pagination })
    },
  )
}
