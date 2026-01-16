import { prisma } from '@/lib/prisma'
import { ListQuery, buildOrderBy } from '@/utils/helpers'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

export const contaBancariaCreateSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo_conta: z.enum(['BANCARIA', 'CONTABIL']).default('BANCARIA'),
  // Campos para contas bancárias (opcionais)
  banco: z.string().optional(),
  agencia: z.string().optional(),
  numero: z.string().optional(),
  digito: z.string().optional(),
  tipoConta: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'CREDITO']).optional(),
  saldoInicial: z.coerce.number().default(0),
  limiteCredito: z.coerce.number().optional(),
  dataAbertura: z.coerce.date().optional(),
  // Campos para contas contábeis (hierarquia)
  conta_pai_id: z.string().uuid().optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
})

export const contaBancariaUpdateSchema = contaBancariaCreateSchema.partial()

export const contaBancariaResponseSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  nome: z.string(),
  tipo_conta: z.enum(['BANCARIA', 'CONTABIL']),
  banco: z.string().nullable(),
  agencia: z.string().nullable(),
  numero: z.string().nullable(),
  digito: z.string().nullable(),
  tipoConta: z.string().nullable(),
  saldoInicial: z.number(),
  saldoAtual: z.number(),
  limiteCredito: z.number().nullable(),
  dataAbertura: z.date().nullable(),
  conta_pai_id: z.string().uuid().nullable(),
  ativo: z.boolean(),
  observacoes: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Paginated responses
export const paginatedContasBancariasSchema = z.object({
  data: z.array(contaBancariaResponseSchema),
  pagination: z.object({
    count: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
  }),
});

// Type exports
export type ContaBancariaCreate = z.infer<typeof contaBancariaCreateSchema>
export type ContaBancariaUpdate = z.infer<typeof contaBancariaUpdateSchema>

export class ContaBancariaService {
  async getContasBancariaPaginated(
    organizationId: string,
    params: ListQuery,
  ): Promise<z.infer<typeof paginatedContasBancariasSchema>> {
    const {
      page = 1,
      limit = 50,
      search,
      orderBy = 'created_at',
      order = 'desc',
      ativo,
    } = params

    const where: any = {
      organization_id: organizationId,
      ...(ativo !== undefined && { ativo }),
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { banco: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orderByTerms = buildOrderBy(orderBy, order)

    const [contas, count] = await Promise.all([
      prisma.contaBancaria.findMany({
        where,
        orderBy: orderByTerms.length > 0 ? orderByTerms : undefined,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contaBancaria.count({ where }),
    ])

    const total_pages = Math.ceil(count / limit)

    return {
      data: contas.map(c => this.serializeContaBancaria(c)),
      pagination: {
        count,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    }
  }

  async getContaBancariaById(
    id: string,
    organizationId: string,
  ): Promise<z.infer<typeof contaBancariaResponseSchema> | null> {
    const conta = await prisma.contaBancaria.findFirst({
      where: { id, organization_id: organizationId },
    })

    return conta ? this.serializeContaBancaria(conta) : null
  }

  async createContaBancaria(
    data: ContaBancariaCreate,
    organizationId: string,
  ): Promise<string> {
    // Validar conta pai se fornecida
    if (data.conta_pai_id) {
      const contaPai = await prisma.contaBancaria.findFirst({
        where: {
          id: data.conta_pai_id,
          organization_id: organizationId,
        },
      })
      if (!contaPai) {
        throw new Error('Conta pai não encontrada.')
      }
    }

    // Validar campos bancários apenas para contas bancárias
    if (data.tipo_conta === 'BANCARIA' && !data.banco) {
      throw new Error('Banco é obrigatório para contas bancárias.')
    }

    const conta = await prisma.contaBancaria.create({
      data: {
        codigo: data.codigo,
        nome: data.nome,
        tipo_conta: data.tipo_conta,
        banco: data.banco || null,
        agencia: data.agencia || null,
        numero: data.numero || null,
        digito: data.digito || null,
        tipoConta: data.tipoConta || null,
        saldoInicial: new Decimal(data.saldoInicial || 0),
        saldoAtual: new Decimal(data.saldoInicial || 0),
        limiteCredito: data.limiteCredito ? new Decimal(data.limiteCredito) : null,
        dataAbertura: data.dataAbertura || null,
        conta_pai_id: data.conta_pai_id || null,
        ativo: data.ativo ?? true,
        observacoes: data.observacoes || null,
        organization_id: organizationId,
      },
    })

    return conta.id
  }

  async updateContaBancaria(
    id: string,
    data: ContaBancariaUpdate,
    organizationId: string,
  ): Promise<string | null> {
    const conta = await prisma.contaBancaria.findFirst({
      where: { id, organization_id: organizationId },
    })

    if (!conta) return null

    const updateData: any = { ...data }
    if (data.saldoInicial !== undefined) {
      updateData.saldoInicial = new Decimal(data.saldoInicial)
    }
    if (data.limiteCredito !== undefined) {
      updateData.limiteCredito = data.limiteCredito ? new Decimal(data.limiteCredito) : null
    }

    await prisma.contaBancaria.update({
      where: { id },
      data: updateData,
    })

    return id
  }

  async deleteContaBancaria(id: string, organizationId: string): Promise<boolean> {
    const conta = await prisma.contaBancaria.findFirst({
      where: { id, organization_id: organizationId },
    })

    if (!conta) return false

    await prisma.contaBancaria.delete({ where: { id } })
    return true
  }

  private serializeContaBancaria(conta: any): z.infer<typeof contaBancariaResponseSchema> {
    return {
      id: conta.id,
      codigo: conta.codigo,
      nome: conta.nome,
      tipo_conta: conta.tipo_conta,
      banco: conta.banco,
      agencia: conta.agencia,
      numero: conta.numero,
      digito: conta.digito,
      tipoConta: conta.tipoConta,
      saldoInicial: conta.saldoInicial?.toNumber() ?? 0,
      saldoAtual: conta.saldoAtual?.toNumber() ?? 0,
      limiteCredito: conta.limiteCredito?.toNumber() ?? null,
      dataAbertura: conta.dataAbertura,
      conta_pai_id: conta.conta_pai_id,
      ativo: conta.ativo,
      observacoes: conta.observacoes,
      created_at: conta.created_at,
      updated_at: conta.updated_at,
    }
  }
}