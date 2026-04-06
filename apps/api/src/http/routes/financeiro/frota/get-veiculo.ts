import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getVeiculo(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Obter veículo com histórico operacional',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          response: { 200: z.any() },
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

        if (cannot('get', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar a frota.')
        }

        const veiculo = await prisma.veiculo.findFirst({
          where: { id: veiculoId, organization_id: organization.id },
          include: {
            abastecimentos: {
              orderBy: { data: 'desc' },
              take: 50,
              include: {
                lancamento: {
                  select: {
                    id: true,
                    numero: true,
                    valor: true,
                    categoria_id: true,
                    conta_bancaria_id: true,
                    centro_custo_id: true,
                    pago: true,
                  },
                },
              },
            },
            manutencoes: {
              orderBy: { data: 'desc' },
              take: 50,
              include: {
                lancamento: {
                  select: {
                    id: true,
                    numero: true,
                    valor: true,
                    categoria_id: true,
                    conta_bancaria_id: true,
                    centro_custo_id: true,
                    pago: true,
                  },
                },
              },
            },
            viagens: {
              orderBy: { data_inicio: 'desc' },
              take: 50,
              include: {
                lancamento: {
                  select: {
                    id: true,
                    numero: true,
                    valor: true,
                    categoria_id: true,
                    conta_bancaria_id: true,
                    centro_custo_id: true,
                    pago: true,
                  },
                },
              },
            },
          },
        })

        if (!veiculo) {
          throw new BadRequestError('Veículo não encontrado.')
        }

        return reply.send(veiculo)
      },
    )
}
