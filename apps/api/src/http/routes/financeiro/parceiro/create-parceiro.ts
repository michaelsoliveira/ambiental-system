import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { parceiroSchema } from '@saas/auth'
import { BadRequestError } from '../../_errors/bad-request-error'

export async function createParceiro(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/parceiros',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Criar novo parceiro (cliente/fornecedor)',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: z.object({
            tipo_parceiro: z.string().nullable().optional(),
            pessoa_id: z.string().uuid(),
            observacoes: z.string().nullable().optional(),
            ativo: z.boolean()
          }),
          response: {
            201: z.object({ parceiroId: z.string().uuid() }),
          },
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

        if (cannot('create', 'Parceiro')) {
          throw new UnauthorizedError('Você não tem permissão para criar parceiros.')
        }

        const { tipo_parceiro, pessoa_id, observacoes, ativo }: any = request.body
        
        const existingParceiro = await prisma.parceiro.findUnique({
          where: {
            organization_id_pessoa_id: {
              organization_id: organization.id,
              pessoa_id,
            },
          },
        })

        if (existingParceiro) {
          throw new BadRequestError('Este parceiro já existe nesta organização.')
        }

        const parceiro = await prisma.parceiro.create({
          data: {
            organization_id: organization.id,
            tipo_parceiro,
            pessoa_id,
            observacoes,
            ativo,
          },
        })

        return reply.status(201).send({ parceiroId: parceiro.id })
      },
    )
}