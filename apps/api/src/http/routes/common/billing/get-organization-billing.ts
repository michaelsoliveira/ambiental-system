import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getOrganizationBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/billing',
      {
        schema: {
          tags: ['Billing'],
          summary: 'Get billing information from organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              billing: z.object({
                seats: z.object({
                  amount: z.number(),
                  unit: z.number(),
                  price: z.number(),
                }),
                // total: z.number(),
              }),
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

        if (cannot('get', 'Billing')) {
          throw new UnauthorizedError(
            `You're not allowed to get billing details from this organization.`,
          )
        }

        const [amountOfMembers] = await Promise.all([
          prisma.member.count({
            where: {
              organization_id: organization.id,
              members_roles: { 
                some: {
                    roles: {
                        name: {
                            not: 'billing'
                        }
                    }
                }
               },
            },
          }),
          // prisma.project.count({
          //   where: {
          //     organization_id: organization.id,
          //   },
          // }),
        ])

        return {
          billing: {
            seats: {
              amount: amountOfMembers,
              unit: 10,
              price: amountOfMembers * 10,
            },
            // projects: {
            //   amount: amountOfProjects,
            //   unit: 20,
            //   price: amountOfProjects * 20,
            // },
            // total: amountOfMembers * 10 + amountOfProjects * 20,
          },
        }
      },
    )
}