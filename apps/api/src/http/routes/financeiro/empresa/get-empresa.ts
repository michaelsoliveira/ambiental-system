import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function getEmpresa(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).get(
    '/organizations/:slug/financeiro/empresas/:id',
    {
      schema: {
        tags: ['Financeiro - Empresas'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      const empresa = await app.empresaService.getById(organization.id, id)
      if (!empresa) return reply.status(404).send({ message: 'Empresa não encontrada.' })
      return reply.send({ empresa })
    },
  )
}
