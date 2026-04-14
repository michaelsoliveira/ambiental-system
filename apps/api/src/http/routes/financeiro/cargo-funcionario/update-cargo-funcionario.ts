import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { cargoFuncionarioUpdateSchema } from '@/services/cargo-funcionario.service'

export async function updateCargoFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).put(
    '/organizations/:slug/financeiro/cargos-funcionario/:id',
    {
      schema: {
        tags: ['Financeiro - Cargos de Funcionário'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
        body: cargoFuncionarioUpdateSchema,
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      const updatedId = await app.cargoFuncionarioService.update(organization.id, id, request.body)
      if (!updatedId) return reply.status(404).send({ message: 'Cargo não encontrado.' })
      return reply.send({ id: updatedId })
    },
  )
}
