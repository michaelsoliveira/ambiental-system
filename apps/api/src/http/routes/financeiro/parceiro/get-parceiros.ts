import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getParceiros(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/parceiros',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Listar parceiros',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            ativo: z.boolean().optional(),
            page: z.number().int().min(1).default(1),
            limit: z.number().int().min(1).max(100).default(10),
          }),
          response: {
            200: z.object({
              parceiros: z.array(
                z.object({
                  id: z.string().uuid(),
                  tipo_parceiro: z.string(),
                  pessoa_id: z.string().uuid(),
                  pessoa_nome: z.string().nullable().optional(),
                  observacoes: z.string().nullable(),
                  ativo: z.boolean(),
                  created_at: z.date(),
                  pessoa: z.any()
                }),
              ),
              total: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { ativo, page, limit } = request.query
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'Parceiro')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar parceiros.')
        }

        const where = {
          organization_id: organization.id,
          ...(ativo !== undefined && { ativo }),
        }

        const [parceiros, total] = await Promise.all([
          prisma.parceiro.findMany({
            include: {
              pessoa: {
                include: {
                  endereco: true,
                  fisica: true,
                  juridica: true
                },
              },
            },
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' },
          }),
          prisma.parceiro.count({ where }),
        ])

        return reply.send({ 
          parceiros: parceiros.map((parceiro) => ({
            ...parceiro,
            pessoa_nome: parceiro.pessoa.tipo === 'F' ? parceiro.pessoa.fisica?.nome : parceiro.pessoa.juridica?.nome_fantasia
          })), 
          total 
        })
      },
    )
}