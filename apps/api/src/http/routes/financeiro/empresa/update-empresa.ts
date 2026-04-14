import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { empresaUpdateSchema } from '@/services/empresa.service'

export async function updateEmpresa(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth).put(
    '/organizations/:slug/financeiro/empresas/:id',
    {
      schema: {
        tags: ['Financeiro - Empresas'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().uuid() }),
        body: empresaUpdateSchema,
      },
    },
    async (request, reply) => {
      const { slug, id } = request.params
      const { organization } = await request.getUserMembership(slug)
      const updatedId = await app.empresaService.update(organization.id, id, request.body)
      if (!updatedId) return reply.status(404).send({ message: 'Empresa não encontrada.' })
      return reply.send({ id: updatedId })
    },
  )
}
