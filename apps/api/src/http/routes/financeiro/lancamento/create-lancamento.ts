import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { LancamentoService } from '@/services/lancamento.service'
import { parseMultipartForm } from '@/utils/helpers'

export const lancamentoCreateSchema = z.object({
  numero: z.string().min(1, 'Número do lançamento é obrigatório'),
  tipo: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  data: z.string().refine((date) => !isNaN(Date.parse(date)), 'Data inválida'),
  data_vencimento: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || !isNaN(Date.parse(val)), 'Data de vencimento inválida')
    .transform(val => val === '' ? undefined : val)
    .optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  observacoes: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || val.length > 0, 'Observações inválidas')
    .optional(),
  valor: z.string()
    .transform(val => parseFloat(val))
    .refine(val => !isNaN(val) && val > 0, 'Valor deve ser um número positivo'),
  valor_pago: z.string()
    .transform(val => val ? parseFloat(val) : undefined)
    .refine(val => val === undefined || (!isNaN(val) && val >= 0), 'Valor pago inválido')
    .optional(),
  forma_parcelamento: z.enum(['UNICA', 'FIXA', 'PROGRESSIVA', 'RECORRENTE']).default('UNICA'),
  numero_parcelas: z.string()
    .transform(val => parseInt(val))
    .refine(val => !isNaN(val) && val >= 1, 'Número de parcelas deve ser um número maior que 0'),
  categoria_id: z.string().uuid('ID da categoria é obrigatório'),
  conta_bancaria_id: z.string().uuid('ID da conta bancária é obrigatório'),
  centro_custo_id: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || z.string().uuid().safeParse(val).success, 'ID do centro de custo inválido')
    .transform(val => val === '' ? undefined : val)
    .optional(),
  parceiro_id: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || z.string().uuid().safeParse(val).success, 'ID do parceiro inválido')
    .transform(val => val === '' ? undefined : val)
    .optional(),
  veiculo_id: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || z.string().uuid().safeParse(val).success, 'ID do veículo inválido')
    .transform(val => val === '' ? undefined : val)
    .optional(),
  pago: z.boolean().default(false),
  data_pagamento: z.string()
    .transform(val => val?.trim())
    .refine(val => !val || !isNaN(Date.parse(val)), 'Data de pagamento inválida')
    .transform(val => val === '' ? undefined : val)
    .optional(),
  status_lancamento: z.enum(['PENDENTE', 'CONFIRMADO', 'PAGO', 'CANCELADO', 'ATRASADO']).default('PENDENTE'),
  periodicidade: z
    .enum(['DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'])
    .optional()
    .default('MENSAL'),
  // Controle interno e integração Asaas
  controle_interno: z.preprocess(
    (v) => (v === true || v === 'true' || v === '1' ? true : false),
    z.boolean()
  ).default(false),
  gerar_boleto: z.preprocess(
    (v) => (v === true || v === 'true' || v === '1'),
    z.boolean()
  ).optional().default(false),
  permitir_pix: z.preprocess(
    (v) => (v === true || v === 'true' || v === '1'),
    z.boolean()
  ).optional().default(false),
})

export async function createLancamento(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/financeiro/lancamentos',
      {
        schema: {
          tags: ['Financeiro - Lançamentos'],
          summary: 'Criar novo lançamento',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          consumes: ['multipart/form-data'],
          response: {
            201: z.object({ lancamentoId: z.string().uuid() }),
            400: z.object({ error: z.string() }),
            403: z.object({ error: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          if (!request.isMultipart()) {
            throw new BadRequestError('O corpo da requisição não é multipart/form-data')
          }

          const { slug } = request.params
          const userId = await request.getCurrentUserId()
          const { organization, membership } = await request.getUserMembership(slug)

          const { cannot } = getUserPermissions(
            userId,
            membership.members_roles.map((mr: any) => mr.roles.name),
          )

          if (cannot('create', 'Lancamento')) {
            throw new UnauthorizedError('Você não tem permissão para criar lançamentos.')
          }

          const { data: formData } = await parseMultipartForm(request)
          const parsedData = JSON.parse(formData['data'])
          const result = lancamentoCreateSchema.safeParse(parsedData)

          if (!result.success) {
            const errors = result.error.flatten()
            throw new BadRequestError(
              `Erro de validação: ${JSON.stringify(errors.formErrors)}`
            )
          }

          const lancamento = await LancamentoService.create(organization.id, result.data)

          return reply.status(201).send({ lancamentoId: lancamento.id })
        } catch (error) {
          app.log.error(error)
          
          if (error instanceof UnauthorizedError) {
            return reply.code(403).send({ error: error.message })
          }
          if (error instanceof BadRequestError) {
            return reply.code(400).send({ error: error.message })
          }
          
          return reply.code(400).send({ 
            error: error instanceof Error ? error.message : 'Erro ao criar lançamento' 
          })
        }
      },
    )
}