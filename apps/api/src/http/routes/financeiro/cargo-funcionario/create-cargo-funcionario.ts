import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { cargoFuncionarioCreateSchema } from '@/services/cargo-funcionario.service'

export async function createCargoFuncionario(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).post(
    '/organizations/:slug/financeiro/cargos-funcionario',
    {
      schema: {
        tags: ['Financeiro - Cargos de Funcionário'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        body: cargoFuncionarioCreateSchema,
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { organization } = await request.getUserMembership(slug)
      const id = await app.cargoFuncionarioService.create(organization.id, request.body)
      return reply.status(201).send({ id })
    },
  )
}
