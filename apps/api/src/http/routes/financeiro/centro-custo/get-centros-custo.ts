import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getCentrosCusto(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/centros-custo',
      {
        schema: {
          tags: ['Financeiro - Centros de Custo'],
          summary: 'Listar centros de custo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            ativo: z.string().transform((val) => val === 'true').optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(10),
            orderBy: z.string().optional().default('nome'),
            order: z.enum(['asc', 'desc']).optional().default('asc'),
          }),
          response: {
            200: z.object({
              centros: z.array(z.any()),
              total: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { ativo, search, page, limit, orderBy, order } = request.query
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'CentroCusto')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar centros de custo.')
        }

        const where: any = {
          organization_id: organization.id,
          ...(ativo !== undefined && ativo !== null && { ativo }),
          ...(search && {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { codigo: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
            ],
          }),
        }

        const orderByField = orderBy || 'nome'
        const orderDirection = order || 'asc'

        const [centros, total] = await Promise.all([
          prisma.centroCusto.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [orderByField]: orderDirection },
          }),
          prisma.centroCusto.count({ where }),
        ])

        return reply.send({ centros, total })
      },
    )
}