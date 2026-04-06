import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

const updateParceiroBodySchema = z.object({
  tipo_parceiro: z.enum(['CLIENTE', 'FORNECEDOR', 'AMBOS']).optional(),
  observacoes: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  pessoa_id: z.string().uuid().optional(),
})

export async function updateParceiro(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/parceiros/:parceiroId',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Atualizar parceiro',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), parceiroId: z.string().uuid() }),
          body: updateParceiroBodySchema,
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, parceiroId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('update', 'Parceiro')) {
          throw new UnauthorizedError('Você não tem permissão para atualizar parceiros.')
        }

        const parceiro = await prisma.parceiro.findUnique({
          where: { id: parceiroId, organization_id: organization.id },
        })

        if (!parceiro) {
          throw new BadRequestError('Parceiro não encontrado.')
        }

        const body = updateParceiroBodySchema.parse(request.body)

        if (body.pessoa_id && body.pessoa_id !== parceiro.pessoa_id) {
          const dupe = await prisma.parceiro.findUnique({
            where: {
              organization_id_pessoa_id: {
                organization_id: organization.id,
                pessoa_id: body.pessoa_id,
              },
            },
          })
          if (dupe && dupe.id !== parceiroId) {
            throw new BadRequestError('Já existe um parceiro vinculado a esta pessoa.')
          }
        }

        await prisma.parceiro.update({
          where: { id: parceiroId },
          data: {
            ...(body.tipo_parceiro !== undefined && { tipo_parceiro: body.tipo_parceiro }),
            ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
            ...(body.ativo !== undefined && { ativo: body.ativo }),
            ...(body.pessoa_id !== undefined && { pessoa_id: body.pessoa_id }),
          },
        })

        return reply.status(204).send()
      },
    )
}