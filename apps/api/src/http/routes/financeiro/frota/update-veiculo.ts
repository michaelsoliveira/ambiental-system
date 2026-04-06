import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

const bodySchema = z.object({
  placa: z.string().min(1).max(10).optional(),
  modelo: z.string().min(1).optional(),
  marca: z.string().min(1).optional(),
  ano: z.number().int().min(1900).max(2100).optional().nullable(),
  tipo: z.string().max(50).optional().nullable(),
  km_atual: z.number().optional().nullable(),
  ativo: z.boolean().optional(),
})

export async function updateVeiculo(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Atualizar veículo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          body: bodySchema,
          response: { 200: z.object({ ok: z.literal(true) }) },
        },
      },
      async (request, reply) => {
        const { slug, veiculoId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('update', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para editar veículos.')
        }

        const existing = await prisma.veiculo.findFirst({
          where: { id: veiculoId, organization_id: organization.id },
        })
        if (!existing) {
          throw new BadRequestError('Veículo não encontrado.')
        }

        const b = request.body
        const placa = b.placa?.trim().toUpperCase()

        if (placa && placa !== existing.placa) {
          const dup = await prisma.veiculo.findFirst({
            where: {
              organization_id: organization.id,
              placa,
              NOT: { id: veiculoId },
            },
          })
          if (dup) throw new BadRequestError('Já existe veículo com esta placa.')
        }

        await prisma.veiculo.update({
          where: { id: veiculoId },
          data: {
            ...(placa !== undefined && { placa }),
            ...(b.modelo !== undefined && { modelo: b.modelo }),
            ...(b.marca !== undefined && { marca: b.marca }),
            ...(b.ano !== undefined && { ano: b.ano }),
            ...(b.tipo !== undefined && { tipo: b.tipo }),
            ...(b.km_atual !== undefined && { km_atual: b.km_atual }),
            ...(b.ativo !== undefined && { ativo: b.ativo }),
          },
        })

        return reply.send({ ok: true })
      },
    )
}
