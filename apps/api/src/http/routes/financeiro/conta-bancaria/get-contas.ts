import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function getContasBancarias(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/contas',
      {
        schema: {
          tags: ['Financeiro - Contas Bancárias'],
          summary: 'Listar contas bancárias',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: z.object({
            ativo: z.string().transform((val) => val === 'true').optional(),
            tipo: z.enum(['BANCARIA', 'CONTABIL']).optional(),
            incluir_hierarquia: z.string().transform((val) => val === 'true').default('false'),
            search: z.string().optional(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(10),
            orderBy: z.string().optional().default('nome'),
            order: z.enum(['asc', 'desc']).optional().default('asc'),
          }),
          response: {
            200: z.object({
              contas: z.array(z.any()),
              total: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const { ativo, tipo, incluir_hierarquia, search, page, limit, orderBy, order } = request.query
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'ContaBancaria')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar contas.')
        }

        const where: any = {
          organization_id: organization.id,
          ...(ativo !== undefined && ativo !== null && { ativo }),
          ...(tipo && { tipo_conta: tipo }),
          ...(search && {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { codigo: { contains: search, mode: 'insensitive' } },
              { banco: { contains: search, mode: 'insensitive' } },
              { agencia: { contains: search, mode: 'insensitive' } },
            ],
          }),
        }

        const include: any = {}
        if (incluir_hierarquia) {
          include.conta_pai = true
          include.subcontas = true
        }

        const orderByField = orderBy || 'nome'
        const orderDirection = order || 'asc'

        const [contas, total] = await Promise.all([
          prisma.contaBancaria.findMany({
            where,
            ...(Object.keys(include).length > 0 && { include }),
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [orderByField]: orderDirection },
          }),
          prisma.contaBancaria.count({ where }),
        ])

        return reply.send({
          contas: contas.map((c) => ({
            id: c.id,
            codigo: c.codigo,
            nome: c.nome,
            tipo_conta: c.tipo_conta,
            banco: c.banco,
            agencia: c.agencia,
            numero: c.numero,
            digito: c.digito,
            tipoConta: c.tipoConta,
            saldoInicial: c.saldoInicial ? Number(c.saldoInicial) : 0,
            saldoAtual: c.saldoAtual ? Number(c.saldoAtual) : 0,
            limiteCredito: c.limiteCredito ? Number(c.limiteCredito) : null,
            dataAbertura: c.dataAbertura,
            conta_pai_id: c.conta_pai_id,
            conta_pai: (c as any).conta_pai ? {
              id: (c as any).conta_pai.id,
              nome: (c as any).conta_pai.nome,
              codigo: (c as any).conta_pai.codigo,
            } : null,
            subcontas: incluir_hierarquia && (c as any).subcontas ? (c as any).subcontas.map((sc: any) => ({
              id: sc.id,
              nome: sc.nome,
              codigo: sc.codigo,
            })) : [],
            ativo: c.ativo,
            observacoes: c.observacoes,
          })),
          total,
        })
      },
    )
}