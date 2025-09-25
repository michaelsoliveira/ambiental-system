import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/members',
      {
        schema: {
          tags: ['Members'],
          summary: 'Get all organization members',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              members: z.array(
                z.object({
                  id: z.string().uuid(),
                  userId: z.string().uuid(),
                  roles: z.array(
                    z.object({
                      id: z.string(),
                      name: z.string(),
                    })
                  ),
                  name: z.string().nullable(),
                  email: z.string().email(),
                  avatarUrl: z.string().url().nullable(),
                }),
              ),
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

        if (cannot('get', 'User')) {
          throw new UnauthorizedError(
            `You're not allowed to see organization members.`,
          )
        }

        const members = await prisma.member.findMany({
          select: {
            id: true,
            members_roles: {
                select: {
                    roles: true
                }
            },
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organization_id: organization.id,
          },
          orderBy: {
            user: {
                username: 'asc'
            }
          },
        })

        const membersWithRoles = members.map(({ user, members_roles, ...member }) => {
            return {
                id: member.id,
                userId: user.id,
                roles: members_roles.map((r) =>
                    ({
                      id: r.roles.id,
                      name: r.roles.name
                    })
                ),
                name: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
            }
        })

        return reply.send({ members: membersWithRoles })
      },
    )
}