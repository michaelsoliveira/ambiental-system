import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getVeiculos(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/frota/veiculos',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Listar veículos da organização',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            ativo: z.string().transform((v) => v === 'true').optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
          }),
          response: {
            200: z.object({
              veiculos: z.array(z.any()),
              total: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { ativo, search, page, limit } = request.query
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar a frota.')
        }

        const where: any = {
          organization_id: organization.id,
          ...(ativo !== undefined && ativo !== null && { ativo }),
          ...(search && {
            OR: [
              { placa: { contains: search, mode: 'insensitive' } },
              { modelo: { contains: search, mode: 'insensitive' } },
              { marca: { contains: search, mode: 'insensitive' } },
            ],
          }),
        }

        const [rows, total] = await Promise.all([
          prisma.veiculo.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { placa: 'asc' },
          }),
          prisma.veiculo.count({ where }),
        ])

        const veiculos = rows.map((v) => ({
          ...v,
          km_atual: v.km_atual ?? null,
        }))

        return reply.send({ veiculos, total })
      },
    )
}
