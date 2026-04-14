import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function getCargoFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/cargos-funcionario/:id',
    {
      schema: {
        tags: ['Financeiro - Cargos de Funcionário'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      const cargo = await app.cargoFuncionarioService.getById(organization.id, id)
      if (!cargo) return reply.status(404).send({ message: 'Cargo não encontrado.' })
      return reply.send({ cargo })
    },
  )
}
