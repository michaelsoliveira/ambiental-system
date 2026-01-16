import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { roleSchema } from '@saas/auth'
import { UserRole } from '@prisma/client'

export async function getInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/invites/:inviteId',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Get an invite',
        params: z.object({
          inviteId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            invite: z.object({
              id: z.string().uuid(),
              role: roleSchema,
              email: z.string().email(),
              created_at: z.date(),
              organization: z.object({
                name: z.string(),
              }),
              author: z
                .object({
                  id: z.string().uuid(),
                  username: z.string().nullable(),
                  avatarUrl: z.string().url().nullable(),
                })
                .nullable(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const { inviteId } = request.params

      const invite = await prisma.invite.findUnique({
        where: {
          id: inviteId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          created_at: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
        },
      })

      if (!invite) {
        throw new BadRequestError('Invite not found')
      }

      return {
        invite: {
          id: invite.id,
          role: invite.role.toLowerCase() as z.infer<typeof roleSchema>,
          email: invite.email,
          created_at: invite.created_at,
          organization: {
            name: invite.organization.name,
          },
          author: invite.author
            ? {
                id: invite.author.id,
                username: invite.author.username,
                avatarUrl: invite.author.avatarUrl,
              }
            : null,
        },
      }
    },
  )
}