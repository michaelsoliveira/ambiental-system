import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function deleteCategoriaFinanceira(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/financial/categorias/:categoriaId',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Deletar categoria',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), categoriaId: z.string().uuid() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, categoriaId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('delete', 'CategoriaFinanceira')) {
          throw new UnauthorizedError('Você não tem permissão para deletar categorias.')
        }

        const categoria = await prisma.categoriaFinanceira.findUnique({
          where: { id: categoriaId, organization_id: organization.id },
        })

        if (!categoria) {
          throw new BadRequestError('Parceiro não encontrado.')
        }

        await prisma.parceiro.delete({ where: { id: categoriaId } })

        return reply.status(204).send()
      },
    )
}