import { hash } from 'bcrypt'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        body: z.object({
          code: z.string(),
          password: z.string().min(6),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code, password } = request.body

      const tokenFromCode = await prisma.verificationToken.findUnique({
        where: { token: code },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError()
      }

      const passwordHash = await hash(password, 6)

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: tokenFromCode.user_id,
          },
          data: {
            password: passwordHash,
          },
        }),
        prisma.verificationToken.delete({
          where: {
            token: code,
          },
        }),
      ])

      return reply.status(204).send()
    },
  )
}