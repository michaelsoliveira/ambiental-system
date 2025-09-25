import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export async function acceptInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/invites/:inviteId/accept',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Accept an invite',
          params: z.object({
            inviteId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { inviteId } = request.params

        const invite = await prisma.invite.findUnique({
          where: {
            id: inviteId,
          },
        })

        if (!invite) {
          throw new BadRequestError('Invite not found or expired.')
        }

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found.')
        }

        if (invite.email !== user.email) {
          throw new BadRequestError('This invite belongs to another user.')
        }
        // console.log(invite)
        const role = await prisma.role.findFirst({
            where: { name: invite.role.toLowerCase() }
        })
        if (!role) {
            throw new BadRequestError('Role not found');
        }
        
        await prisma.$transaction([
          prisma.member.create({
            data: {
              user_id: userId,
              organization_id: invite.organization_id,
              members_roles: {
                create: {
                    role_id: role.id
                }
              }
            },
          }),

          prisma.invite.delete({
            where: {
              id: invite.id,
            },
          }),
        ])

        return reply.status(204).send()
      },
    )
}