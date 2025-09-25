import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get all organization invites',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string().uuid(),
                  role: roleSchema,
                  email: z.string().email(),
                  created_at: z.date(),
                  author: z
                    .object({
                      id: z.string().uuid(),
                      username: z.string().nullable(),
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))

        if (cannot('get', 'Invite')) {
          throw new UnauthorizedError(
            `You're not allowed to get organization invites.`,
          )
        }

        const invites = await prisma.invite.findMany({
          where: {
            organization_id: organization.id,
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
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        })

        return {
            invites: invites.map((invite) => ({
                id: invite.id,
                role: invite.role.toLowerCase() as z.infer<typeof roleSchema>,
                email: invite.email,
                created_at: invite.created_at,
                author: invite.author
                ? {
                    id: invite.author.id,
                    username: invite.author.username
                    }
                : null,
                })),
            }
        },
    )
}