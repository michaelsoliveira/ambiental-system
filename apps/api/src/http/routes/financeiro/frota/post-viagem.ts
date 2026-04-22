import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { FrotaService } from '@/services/frota.service'

const bodySchema = z.object({
  origem: z.string().min(1).max(500),
  destino: z.string().min(1).max(500),
  dataInicio: z.string().min(1),
  dataFim: z.string().optional().nullable(),
  kmRodado: z.number().optional().nullable(),
  valorReceita: z.number().positive().optional().nullable(),
  categoriaId: z.string().uuid().optional().nullable(),
  contaBancariaId: z.string().uuid().optional().nullable(),
  centroCustoId: z.string().uuid().optional().nullable(),
  pago: z.boolean().optional().default(false),
  tipoRegistro: z.enum(['SIMPLES', 'RECORRENTE']).default('SIMPLES'),
  diasSemana: z.array(z.number().int().min(0).max(6)).optional().default([]),
  recorrenciaFim: z.string().optional().nullable(),
})

export async function postViagem(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/frota/veiculos/:veiculoId/viagens',
      {
        schema: {
          tags: ['Financeiro - Frota'],
          summary: 'Registrar viagem (opcionalmente receita / frete)',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), veiculoId: z.string().uuid() }),
          body: bodySchema,
          response: {
            201: z.object({
              viagemIds: z.array(z.string().uuid()),
              lancamentoIds: z.array(z.string().uuid()),
              totalCriadas: z.number().int().positive(),
            }),
          },
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

        if (cannot('create', 'Lancamento')) {
          throw new UnauthorizedError('Você não tem permissão para registrar viagens.')
        }

        const b = request.body
        if (b.tipoRegistro === 'RECORRENTE') {
          const recorrenciaFim = b.recorrenciaFim ? new Date(b.recorrenciaFim) : null
          if (!recorrenciaFim) {
            throw new BadRequestError('Data final da recorrência é obrigatória.')
          }

          const result = await FrotaService.registrarViagensRecorrentesComReceita(
            organization.id,
            {
              veiculoId,
              origem: b.origem,
              destino: b.destino,
              dataInicio: new Date(b.dataInicio),
              dataFim: b.dataFim ? new Date(b.dataFim) : null,
              kmRodado: b.kmRodado ?? null,
              valorReceita: b.valorReceita ?? null,
              categoriaId: b.categoriaId ?? undefined,
              contaBancariaId: b.contaBancariaId ?? undefined,
              centroCustoId: b.centroCustoId ?? null,
              pago: b.pago,
              recorrenciaFim,
              diasSemana: b.diasSemana,
            },
          )

          return reply.status(201).send(result)
        }

        const result = await FrotaService.registrarViagemComReceita(organization.id, {
          veiculoId,
          origem: b.origem,
          destino: b.destino,
          dataInicio: new Date(b.dataInicio),
          dataFim: b.dataFim ? new Date(b.dataFim) : null,
          kmRodado: b.kmRodado ?? null,
          valorReceita: b.valorReceita ?? null,
          categoriaId: b.categoriaId ?? undefined,
          contaBancariaId: b.contaBancariaId ?? undefined,
          centroCustoId: b.centroCustoId ?? null,
          pago: b.pago,
        })

        return reply.status(201).send({
          viagemIds: [result.viagem.id],
          lancamentoIds: result.lancamentoId ? [result.lancamentoId] : [],
          totalCriadas: 1,
        })
      },
    )
}
