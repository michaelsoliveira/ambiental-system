import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/recover',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body

      const userFromEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (!userFromEmail) {
        // We don't want to people to know if the user really exists
        return reply.status(201).send()
      }

      const crypto = await import('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour from now

      const verificationToken = await prisma.verificationToken.create({
        data: {
          type: 'PASSWORD_RECOVERY',
          user_id: userFromEmail.id,
          token,
          expires,
        },
      })
      const code = verificationToken.id

      // Send e-mail with password recover link

      console.log('Password recover token:', code)

      return reply.status(201).send()
    },
  )
}