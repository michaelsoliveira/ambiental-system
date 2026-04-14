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
            ativo: z.coerce.boolean().optional(),
            tipo_parceiro: z.enum(['CLIENTE', 'FORNECEDOR', 'AMBOS']).optional(),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(50),
            orderBy: z.enum(['created_at', 'tipo_parceiro']).optional().default('created_at'),
            order: z.enum(['asc', 'desc']).optional().default('desc'),
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
              pagination: z.object({
                count: z.number(),
                page: z.number(),
                limit: z.number(),
                total_pages: z.number(),
                has_next: z.boolean(),
                has_prev: z.boolean(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { ativo, tipo_parceiro, search, page, limit, orderBy, order } = request.query
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
          ...(tipo_parceiro && { tipo_parceiro }),
          ...(search && {
            OR: [
              { observacoes: { contains: search, mode: 'insensitive' as const } },
              {
                pessoa: {
                  fisica: {
                    nome: { contains: search, mode: 'insensitive' as const },
                  },
                },
              },
              {
                pessoa: {
                  juridica: {
                    nome_fantasia: { contains: search, mode: 'insensitive' as const },
                  },
                },
              },
            ],
          }),
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
            orderBy: { [orderBy]: order },
          }),
          prisma.parceiro.count({ where }),
        ])

        return reply.send({ 
          parceiros: parceiros.map((parceiro) => ({
            ...parceiro,
            pessoa_nome: parceiro.pessoa.tipo === 'F' ? parceiro.pessoa.fisica?.nome : parceiro.pessoa.juridica?.nome_fantasia
          })), 
          total,
          pagination: {
            count: total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
            has_next: page * limit < total,
            has_prev: page > 1,
          },
        })
      },
    )
}