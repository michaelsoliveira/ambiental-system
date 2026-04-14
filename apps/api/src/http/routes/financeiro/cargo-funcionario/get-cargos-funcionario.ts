import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function getCargosFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/cargos-funcionario',
    {
      schema: {
        tags: ['Financeiro - Cargos de Funcionário'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(50),
          search: z.string().optional(),
          ativo: z.coerce.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { organization } = await request.getUserMembership(slug)
      const result = await app.cargoFuncionarioService.list(organization.id, request.query)
      return reply.send({ cargos: result.data, pagination: result.pagination })
    },
  )
}
