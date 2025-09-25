import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getRoles(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/roles',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Get members roles',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
                roles: z.array(
                    z.object({
                    id: z.string().uuid(),
                    name: z.string().nullable()                    
                })),
            })
          },
        },
      },
      async (request, reply) => {
        const roles = await prisma.role.findMany()

        return reply.send({ roles })
      },
    )
}