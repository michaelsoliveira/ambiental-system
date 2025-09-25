import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export async function getOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Get organizations where user is a member',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  slug: z.string(),
                  avatarUrl: z.string().url().nullable(),
                  roles: z.array(roleSchema)
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const userId = await request.getCurrentUserId()

        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            members: {
              select: {
                members_roles: {
                    select: {
                        roles: true
                    }
                },
              },
              where: {
                user_id: userId,
              },
            },
          },
          where: {
            members: {
              some: {
                user_id: userId,
              },
            },
          },
        })

        const organizationsWithUserRole = organizations.map(({ members, ...org }) => {
            return {
                ...org,
                roles: members[0]?.members_roles.map((mr) =>
                mr.roles.name.toLowerCase() as z.infer<typeof roleSchema>
                ) ?? [],
            }
            })

        return { organizations: organizationsWithUserRole }
      },
    )
}