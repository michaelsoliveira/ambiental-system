import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

const bodySchema = z.object({
  placa: z.string().min(1).max(10),
  modelo: z.string().min(1),
  marca: z.string().min(1),
  ano: z.number().int().min(1900).max(2100).optional().nullable(),
  tipo: z.string().max(50).optional().nullable(),
  km_atual: z.number().optional().nullable(),
  ativo: z.boolean().optional().default(true),
})

export async function createVeiculo(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/frota/veiculos',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Cadastrar veículo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: bodySchema,
          response: { 201: z.object({ veiculoId: z.string().uuid() }) },
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

        if (cannot('create', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para cadastrar veículos.')
        }

        const placa = request.body.placa.trim().toUpperCase()

        const dup = await prisma.veiculo.findUnique({
          where: {
            organization_id_placa: {
              organization_id: organization.id,
              placa,
            },
          },
        })
        if (dup) {
          throw new BadRequestError('Já existe veículo com esta placa.')
        }

        const v = await prisma.veiculo.create({
          data: {
            organization_id: organization.id,
            placa,
            modelo: request.body.modelo,
            marca: request.body.marca,
            ano: request.body.ano ?? null,
            tipo: request.body.tipo ?? null,
            km_atual: request.body.km_atual ?? null,
            ativo: request.body.ativo ?? true,
          },
        })

        return reply.status(201).send({ veiculoId: v.id })
      },
    )
}
