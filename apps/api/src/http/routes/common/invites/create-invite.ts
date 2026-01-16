import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { roleSchema } from '@saas/auth'
import { UserRole } from '@prisma/client'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Create a new invite',
          security: [{ bearerAuth: [] }],
          body: z.object({
            email: z.string().email(),
            role: roleSchema,
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              inviteId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError(
            `You're not allowed to create new invites.`,
          )
        }

        const { email, role } = request.body

        const [, domain] = email.split('@')

        if (
          organization.shouldAttachDomain &&
          domain === organization.domain
        ) {
          throw new BadRequestError(
            `Users with '${domain}' domain will join your organization automatically on login.`,
          )
        }

        const inviteWithSameEmail = await prisma.invite.findFirst({
          where: {
            email,
            organization_id: organization.id,
          },
        })

        if (inviteWithSameEmail) {
          throw new BadRequestError(
            'Another invite with same e-mail already exists.',
          )
        }

        const memberWithSameEmail = await prisma.member.findFirst({
          where: {
            organization_id: organization.id,
            user: {
              email,
            },
          },
        })

        if (memberWithSameEmail) {
          throw new BadRequestError(
            'A member with this e-mail already belongs to your organization.',
          )
        }

        const token = crypto.randomUUID()
        const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days from now

        const invite = await prisma.invite.create({
          data: {
            organization_id: organization.id,
            email,
            role: UserRole[role.toUpperCase() as keyof typeof UserRole],
            user_id: userId,
            token,
            expires_at,
          },
        })

        return reply.status(201).send({
          inviteId: invite.id,
        })
      },
    )
}