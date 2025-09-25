import { organizationSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function transferOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/owner',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Transfer organization ownership',
          security: [{ bearerAuth: [] }],
          body: z.object({
            transferToUserId: z.string().uuid(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { membership, organization } =
          await request.getUserMembership(slug)

        const authOrganization = organizationSchema.parse(organization)

        const { cannot } = getUserPermissions(userId, membership.members_roles.map((mr: any) => mr.roles.name))

        if (cannot('transfer_ownership', authOrganization)) {
          throw new UnauthorizedError(
            `You're not allowed to transfer this organization ownership.`,
          )
        }

        const { transferToUserId } = request.body

        const roleOwner = await prisma.role.findFirst({
            where: { name: 'owner' },
        })

        if (!roleOwner) {
            throw new Error('Role "owner" não encontrada no banco.')
        }

        const roleOwnerId = roleOwner.id

        const transferMembership = await prisma.member.findUnique({
          where: {
            user_id_organization_id: {
              organization_id: organization.id,
              user_id: transferToUserId,
            },
          },
        })

        if (!transferMembership) {
          throw new BadRequestError(
            'Target user is not a member of this organization.',
          )
        }

        const roleAdmin = await prisma.role.findFirst({
            where: { name: 'admin' }
        })

        await prisma.$transaction(async (tx) => {
            // garante que o novo dono é pelo menos admin
            const existingRole = await tx.memberRole.findUnique({
                where: {
                member_id_role_id: {
                    member_id: transferMembership.id,
                    role_id: roleAdmin!.id,
                },
                },
            })

            if (!existingRole) {
                await tx.memberRole.create({
                    data: {
                        member_id: transferMembership.id,
                        role_id: roleAdmin!.id,
                    },
                })
            }

            // transfere a ownership
            await tx.organization.update({
                where: { id: organization.id },
                data: { owner_id: transferToUserId },
            })

            // opcional: rebaixa o dono antigo para admin
            // se quiser que ele perca a ownership mas continue admin
            const oldMembership = await tx.member.findUnique({
                where: {
                user_id_organization_id: {
                    organization_id: organization.id,
                    user_id: userId,
                },
                },
            })

            if (oldMembership) {
                await tx.memberRole.deleteMany({
                    where: { member_id: oldMembership.id, role_id: roleOwnerId },
                    })
                }
            })


        return reply.status(204).send()
      },
    )
}