import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'

const categoriaPatrimonioValues = [
  'IMOVEL',
  'VEICULO',
  'MAQUINA_EQUIPAMENTO',
  'MOVEL_UTENSILIO',
  'INFORMATICA',
  'INVESTIMENTO',
  'ESTOQUE',
  'OUTRO',
] as const

const metodoDepreciacaoValues = [
  'LINEAR',
  'ACELERADA',
  'MANUAL',
  'NAO_DEPRECIA',
] as const

const statusAtivoValues = ['ATIVO', 'BAIXADO', 'VENDIDO', 'MANUTENCAO', 'INATIVO'] as const

const tipoPassivoValues = [
  'EMPRESTIMO',
  'FINANCIAMENTO',
  'PARCELAMENTO',
  'FORNECEDOR',
  'TRIBUTO',
  'TRABALHISTA',
  'OUTRO',
] as const

const statusPassivoValues = ['ABERTO', 'QUITADO', 'CANCELADO', 'ATRASADO'] as const

export const patrimonioAtivoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  categoria: z.enum(categoriaPatrimonioValues),
  tipo: z.string().optional(),
  codigo: z.string().optional(),
  data_aquisicao: z.coerce.date().optional(),
  valor_aquisicao: z.coerce.number().min(0).default(0),
  valor_atual: z.coerce.number().min(0).optional(),
  metodo_depreciacao: z.enum(metodoDepreciacaoValues).optional(),
  taxa_depreciacao_anual: z.coerce.number().min(0).optional(),
  vida_util_meses: z.coerce.number().int().min(0).optional(),
  status: z.enum(statusAtivoValues).default('ATIVO'),
  localizacao: z.string().optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
  veiculo_id: z.string().uuid().optional(),
  conta_bancaria_id: z.string().uuid().optional(),
  lancamento_id: z.string().uuid().optional(),
})

export const patrimonioAtivoUpdateSchema = patrimonioAtivoCreateSchema.partial()

export const patrimonioPassivoCreateSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(tipoPassivoValues),
  credor: z.string().optional(),
  valor_original: z.coerce.number().min(0).default(0),
  saldo_devedor: z.coerce.number().min(0).optional(),
  data_inicio: z.coerce.date().optional(),
  data_vencimento: z.coerce.date().optional(),
  taxa_juros: z.coerce.number().min(0).optional(),
  status: z.enum(statusPassivoValues).default('ABERTO'),
  observacoes: z.string().optional(),
})

export const patrimonioPassivoUpdateSchema = patrimonioPassivoCreateSchema.partial()

export const patrimonioAvaliacaoCreateSchema = z.object({
  data_avaliacao: z.coerce.date(),
  valor: z.coerce.number().min(0),
  avaliador: z.string().optional(),
  metodo: z.string().optional(),
  observacoes: z.string().optional(),
})

export class PatrimonioService {
  async getResumo(organizationId: string) {
    const [ativos, passivosManuais, lancamentos, parcelas] = await Promise.all([
      prisma.patrimonioAtivo.findMany({
        where: {
          organization_id: organizationId,
          status: { in: ['ATIVO', 'MANUTENCAO'] },
        },
        select: { valor_atual: true },
      }),
      prisma.patrimonioPassivo.findMany({
        where: {
          organization_id: organizationId,
          status: { in: ['ABERTO', 'ATRASADO'] },
        },
        select: { saldo_devedor: true },
      }),
      prisma.lancamento.findMany({
        where: {
          organization_id: organizationId,
          tipo: 'DESPESA',
          pago: false,
          status_lancamento: { notIn: ['CANCELADO', 'PAGO'] },
          parcelas: { none: {} },
        },
        select: { valor: true, valor_pago: true },
      }),
      prisma.parcela.findMany({
        where: {
          organization_id: organizationId,
          pago: false,
          status_parcela: { notIn: ['CANCELADA', 'PAGA'] },
          lancamento: { tipo: 'DESPESA', status_lancamento: { not: 'CANCELADO' } },
        },
        select: { valor: true, valorPago: true },
      }),
    ])

    const totalAtivos = ativos.reduce((total, ativo) => total + Number(ativo.valor_atual), 0)
    const totalPassivosManuais = passivosManuais.reduce(
      (total, passivo) => total + Number(passivo.saldo_devedor),
      0,
    )
    const dividasLancamentos = lancamentos.reduce(
      (total, lancamento) =>
        total + Math.max(Number(lancamento.valor) - Number(lancamento.valor_pago ?? 0), 0),
      0,
    )
    const dividasParcelas = parcelas.reduce(
      (total, parcela) =>
        total + Math.max(Number(parcela.valor) - Number(parcela.valorPago ?? 0), 0),
      0,
    )
    const dividasAutomaticas = dividasLancamentos + dividasParcelas
    const totalDividas = dividasAutomaticas + totalPassivosManuais

    return {
      totalAtivos,
      dividasAutomaticas,
      totalPassivosManuais,
      totalDividas,
      patrimonioLiquido: totalAtivos - totalDividas,
      relacaoDividaPatrimonio: totalAtivos > 0 ? totalDividas / totalAtivos : null,
      origensDivida: [
        { origem: 'Automática', valor: dividasAutomaticas },
        { origem: 'Manual', valor: totalPassivosManuais },
      ],
    }
  }

  async listAtivos(organizationId: string, params: any) {
    const { search, categoria, status, page = 1, limit = 10 } = params
    const where: any = {
      organization_id: organizationId,
      ...(categoria && { categoria }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
          { localizacao: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [ativos, total] = await Promise.all([
      prisma.patrimonioAtivo.findMany({
        where,
        include: { avaliacoes: { orderBy: { data_avaliacao: 'desc' }, take: 3 }, documentos: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.patrimonioAtivo.count({ where }),
    ])

    return { ativos: ativos.map((ativo) => this.serializeAtivo(ativo)), total }
  }

  async getAtivo(id: string, organizationId: string) {
    const ativo = await prisma.patrimonioAtivo.findFirst({
      where: { id, organization_id: organizationId },
      include: { avaliacoes: { orderBy: { data_avaliacao: 'desc' } }, documentos: true },
    })

    return ativo ? this.serializeAtivo(ativo) : null
  }

  async createAtivo(data: z.infer<typeof patrimonioAtivoCreateSchema>, organizationId: string) {
    const ativo = await prisma.patrimonioAtivo.create({
      data: {
        ...data,
        organization_id: organizationId,
        valor_aquisicao: new Decimal(data.valor_aquisicao),
        valor_atual: new Decimal(data.valor_atual ?? data.valor_aquisicao),
      },
    })

    return ativo.id
  }

  async updateAtivo(
    id: string,
    data: z.infer<typeof patrimonioAtivoUpdateSchema>,
    organizationId: string,
  ) {
    const ativo = await prisma.patrimonioAtivo.findFirst({ where: { id, organization_id: organizationId } })
    if (!ativo) return null

    const updateData: any = { ...data }
    if (data.valor_aquisicao !== undefined) updateData.valor_aquisicao = new Decimal(data.valor_aquisicao)
    if (data.valor_atual !== undefined) updateData.valor_atual = new Decimal(data.valor_atual)
    if (data.taxa_depreciacao_anual !== undefined) {
      updateData.taxa_depreciacao_anual = data.taxa_depreciacao_anual
        ? new Decimal(data.taxa_depreciacao_anual)
        : null
    }

    await prisma.patrimonioAtivo.update({ where: { id }, data: updateData })
    return id
  }

  async deleteAtivo(id: string, organizationId: string) {
    const ativo = await prisma.patrimonioAtivo.findFirst({ where: { id, organization_id: organizationId } })
    if (!ativo) return false

    await prisma.patrimonioAtivo.delete({ where: { id } })
    return true
  }

  async createAvaliacao(
    ativoId: string,
    data: z.infer<typeof patrimonioAvaliacaoCreateSchema>,
    organizationId: string,
  ) {
    const ativo = await prisma.patrimonioAtivo.findFirst({
      where: { id: ativoId, organization_id: organizationId },
    })
    if (!ativo) return null

    const avaliacao = await prisma.$transaction(async (tx) => {
      const created = await tx.patrimonioAvaliacao.create({
        data: {
          ...data,
          patrimonio_ativo_id: ativoId,
          organization_id: organizationId,
          valor: new Decimal(data.valor),
        },
      })

      await tx.patrimonioAtivo.update({
        where: { id: ativoId },
        data: { valor_atual: new Decimal(data.valor) },
      })

      return created
    })

    return avaliacao.id
  }

  async listPassivos(organizationId: string, params: any) {
    const { search, tipo, status, page = 1, limit = 10 } = params
    const where: any = {
      organization_id: organizationId,
      ...(tipo && { tipo }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { descricao: { contains: search, mode: 'insensitive' } },
          { credor: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [passivos, total] = await Promise.all([
      prisma.patrimonioPassivo.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.patrimonioPassivo.count({ where }),
    ])

    return { passivos: passivos.map((passivo) => this.serializePassivo(passivo)), total }
  }

  async getPassivo(id: string, organizationId: string) {
    const passivo = await prisma.patrimonioPassivo.findFirst({
      where: { id, organization_id: organizationId },
    })

    return passivo ? this.serializePassivo(passivo) : null
  }

  async createPassivo(data: z.infer<typeof patrimonioPassivoCreateSchema>, organizationId: string) {
    const passivo = await prisma.patrimonioPassivo.create({
      data: {
        ...data,
        organization_id: organizationId,
        valor_original: new Decimal(data.valor_original),
        saldo_devedor: new Decimal(data.saldo_devedor ?? data.valor_original),
        taxa_juros: data.taxa_juros ? new Decimal(data.taxa_juros) : null,
      },
    })

    return passivo.id
  }

  async updatePassivo(
    id: string,
    data: z.infer<typeof patrimonioPassivoUpdateSchema>,
    organizationId: string,
  ) {
    const passivo = await prisma.patrimonioPassivo.findFirst({ where: { id, organization_id: organizationId } })
    if (!passivo) return null

    const updateData: any = { ...data }
    if (data.valor_original !== undefined) updateData.valor_original = new Decimal(data.valor_original)
    if (data.saldo_devedor !== undefined) updateData.saldo_devedor = new Decimal(data.saldo_devedor)
    if (data.taxa_juros !== undefined) {
      updateData.taxa_juros = data.taxa_juros ? new Decimal(data.taxa_juros) : null
    }

    await prisma.patrimonioPassivo.update({ where: { id }, data: updateData })
    return id
  }

  async deletePassivo(id: string, organizationId: string) {
    const passivo = await prisma.patrimonioPassivo.findFirst({ where: { id, organization_id: organizationId } })
    if (!passivo) return false

    await prisma.patrimonioPassivo.delete({ where: { id } })
    return true
  }

  private serializeAtivo(ativo: any) {
    return {
      ...ativo,
      valor_aquisicao: Number(ativo.valor_aquisicao),
      valor_atual: Number(ativo.valor_atual),
      taxa_depreciacao_anual: ativo.taxa_depreciacao_anual ? Number(ativo.taxa_depreciacao_anual) : null,
      avaliacoes: ativo.avaliacoes?.map((avaliacao: any) => ({
        ...avaliacao,
        valor: Number(avaliacao.valor),
      })) ?? [],
      documentos: ativo.documentos ?? [],
    }
  }

  private serializePassivo(passivo: any) {
    return {
      ...passivo,
      valor_original: Number(passivo.valor_original),
      saldo_devedor: Number(passivo.saldo_devedor),
      taxa_juros: passivo.taxa_juros ? Number(passivo.taxa_juros) : null,
    }
  }
}
