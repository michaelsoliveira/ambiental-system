import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function deleteCargoFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).delete(
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
      const deleted = await app.cargoFuncionarioService.delete(organization.id, id)
      if (!deleted) return reply.status(404).send({ message: 'Cargo não encontrado.' })
      return reply.status(204).send()
    },
  )
}
