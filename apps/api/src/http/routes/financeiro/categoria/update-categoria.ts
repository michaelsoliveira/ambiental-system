import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

const updateCategoriaBodySchema = z.object({
  codigo: z.string().optional(),
  nome: z.string().min(1).optional(),
  descricao: z.string().nullable().optional(),
  tipo: z.enum(['RECEITA', 'DESPESA']).optional(),
  nivel: z.number().int().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  ativo: z.boolean().optional(),
})

export async function updateCategoriaFinanceira(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/categorias/:categoriaId',
      {
        schema: {
          tags: ['Financeiro - Categorias'],
          summary: 'Atualizar categoria financeira',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), categoriaId: z.string().uuid() }),
          body: updateCategoriaBodySchema,
          response: { 200: z.object({ categoriaId: z.string().uuid() }) },
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

        if (cannot('update', 'CategoriaFinanceira')) {
          throw new UnauthorizedError('Você não tem permissão para atualizar categorias.')
        }

        const categoriaFinanceira = await prisma.categoriaFinanceira.findUnique({
          where: { id: categoriaId, organization_id: organization.id },
        })

        if (!categoriaFinanceira) {
          throw new BadRequestError('Categoria não encontrada.')
        }

        await prisma.categoriaFinanceira.update({
          where: { id: categoriaId },
          data: request.body,
        })

        return reply.status(200).send({ categoriaId: categoriaId })
      },
    )
}