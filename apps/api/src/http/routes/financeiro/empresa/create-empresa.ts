import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { empresaCreateSchema } from '@/services/empresa.service'

export async function createEmpresa(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).post(
    '/organizations/:slug/financeiro/empresas',
    {
      schema: {
        tags: ['Financeiro - Empresas'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string() }),
        body: empresaCreateSchema,
      },
    },
    async (request, reply) => {
      const { slug } = request.params
      const { organization } = await request.getUserMembership(slug)
      const id = await app.empresaService.create(organization.id, request.body)
      return reply.status(201).send({ id })
    },
  )
}
