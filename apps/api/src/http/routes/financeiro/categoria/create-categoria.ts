import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { BadRequestError } from '../../_errors/bad-request-error'

export async function createCategoriaFinanceira(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/categorias',
      {
        schema: {
          tags: ['Financeiro - Categorias'],
          summary: 'Criar nova categoria financeira',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: z.object({
            codigo: z.string(),
            nome: z.string().min(1, 'O nome da categoria é obrigatório'),
            tipo: z.enum(['RECEITA', 'DESPESA']).default('RECEITA'),
            descricao: z.string().optional()
          }),
          response: { 201: z.object({ categoriaId: z.string().uuid() }) },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('create', 'CategoriaFinanceira')) {
          throw new UnauthorizedError('Você não tem permissão para criar categorias.')
        }

        const existingCodigo = await prisma.categoriaFinanceira.findUnique({
          where: {
            organization_id_codigo: {
              organization_id: organization.id,
              codigo: request.body.codigo,
            },
          },
        })

        if (existingCodigo) {
          throw new BadRequestError('Este código de categoria já existe.')
        }

        const categoria = await prisma.categoriaFinanceira.create({
          data: {
            ...request.body,
            organization_id: organization.id,
          },
        })

        return reply.status(201).send({ categoriaId: categoria.id })
      },
    )
}