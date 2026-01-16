import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getCategoriaFinanceira(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financial/categorias/:categoriaId',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Obter detalhes de um parceiro',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), categoriaId: z.string().uuid() }),
          response: {
            200: z.object({
              categoria: z.object({
                codigo: z.string().min(1),
                nome: z.string().min(1),
                descricao: z.string().nullable(),
                tipo: z.enum(['RECEITA', 'DESPESA']),
                parent_id: z.string().uuid().nullable(),
                created_at: z.date(),
              }),
            }),
          },
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

        if (cannot('get', 'CategoriaFinanceira')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar esta categoria.')
        }

        const categoria = await prisma.categoriaFinanceira.findUnique({
          where: {
            id: categoriaId,
            organization_id: organization.id,
          },
        })

        if (!categoria) {
          throw new BadRequestError('Parceiro não encontrado.')
        }

        return reply.send({ categoria })
      },
    )
}