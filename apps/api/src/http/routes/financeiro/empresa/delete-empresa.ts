import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function deleteEmpresa(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).delete(
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
      const deleted = await app.empresaService.delete(organization.id, id)
      if (!deleted) return reply.status(404).send({ message: 'Empresa não encontrada.' })
      return reply.status(204).send()
    },
  )
}
