import { Prisma, Lancamento } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export interface LancamentoFilters {
  search?: string
  tipo?: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA' | 'todos'
  status?: 'PENDENTE' | 'CONFIRMADO' | 'PAGO' | 'CANCELADO' | 'ATRASADO' | 'todos'
  pago?: 'true' | 'false' | 'todos'
  filtrar_por?: 'data' | 'data_vencimento' | 'data_pagamento'
  data_inicio?: string
  data_fim?: string
  categoria_id?: string
  conta_bancaria_id?: string
  centro_custo_id?: string
  parceiro_id?: string
  forma_parcelamento?: 'UNICA' | 'FIXA' | 'PROGRESSIVA' | 'todos'
  valor_min?: string
  valor_max?: string
  apenas_vencidos?: boolean
  apenas_a_vencer?: boolean
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface CreateLancamentoData {
  numero: string
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  data: string
  data_vencimento?: string
  data_competencia?: string // MM/YYYY
  descricao: string
  observacoes?: string
  valor: number
  forma_parcelamento: 'UNICA' | 'FIXA' | 'PROGRESSIVA'
  numero_parcelas: number
  categoria_id: string
  conta_bancaria_id: string
  centro_custo_id?: string
  parceiro_id?: string
  pago: boolean
  status_lancamento: 'PENDENTE' | 'CONFIRMADO' | 'PAGO' | 'CANCELADO' | 'ATRASADO'
  valor_pago?: number
  data_pagamento?: string
  // Recorrência
  tipo_repeticao?: 'NENHUMA' | 'RECORRENTE' | 'PARCELADO'
  periodicidade?: 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
  data_fim_repeticao?: string
}

export interface UpdateLancamentoData extends Partial<CreateLancamentoData> {}

export interface LancamentoWithRelations extends Lancamento {
  parceiro?: {
    id: string
    pessoa: {
      tipo: 'F' | 'J'
      fisica?: { nome: string } | null
      juridica?: { nome_fantasia: string } | null
    }
  } | null
  conta_bancaria?: {
    id: string
    nome: string
  }
  categoria?: {
    id: string
    nome: string
    tipo: string
  }
  centro_custo?: {
    id: string
    nome: string
  } | null
}

export class LancamentoService {
  /**
   * Constrói o filtro WHERE do Prisma baseado nos filtros fornecidos
   */
  private static buildWhereClause(
    organizationId: string,
    filters: LancamentoFilters
  ): Prisma.LancamentoWhereInput {
    const where: Prisma.LancamentoWhereInput = {
      organization_id: organizationId,
    }

    // Filtro de busca (search)
    if (filters.search) {
      where.OR = [
        { numero: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
        { observacoes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Filtro de tipo
    if (filters.tipo && filters.tipo !== 'todos') {
      where.tipo = filters.tipo
    }

    // Filtro de status
    if (filters.status && filters.status !== 'todos') {
      where.status_lancamento = filters.status
    }

    // Filtro de pagamento
    if (filters.pago && filters.pago !== 'todos') {
      where.pago = filters.pago === 'true'
    }

    // Filtros de data
    if (filters.data_inicio || filters.data_fim) {
      const dateField = filters.filtrar_por || 'data'
      const dateFilter: any = {}

      if (filters.data_inicio) {
        dateFilter.gte = new Date(filters.data_inicio)
      }
      if (filters.data_fim) {
        const endDate = new Date(filters.data_fim)
        endDate.setHours(23, 59, 59, 999)
        dateFilter.lte = endDate
      }

      if (dateField === 'data') {
        where.data = dateFilter
      } else if (dateField === 'data_vencimento') {
        where.data_vencimento = dateFilter
      } else if (dateField === 'data_pagamento') {
        where.data_pagamento = dateFilter
      }
    }

    // Filtro de categoria
    if (filters.categoria_id) {
      where.categoria_id = filters.categoria_id
    }

    // Filtro de conta bancária
    if (filters.conta_bancaria_id) {
      where.conta_bancaria_id = filters.conta_bancaria_id
    }

    // Filtro de centro de custo
    if (filters.centro_custo_id) {
      where.centro_custo_id = filters.centro_custo_id
    }

    // Filtro de parceiro
    if (filters.parceiro_id) {
      where.parceiro_id = filters.parceiro_id
    }

    // Filtro de forma de parcelamento
    if (filters.forma_parcelamento && filters.forma_parcelamento !== 'todos') {
      where.forma_parcelamento = filters.forma_parcelamento
    }

    // Filtros de valor
    if (filters.valor_min || filters.valor_max) {
      where.valor = {}
      if (filters.valor_min) {
        where.valor.gte = new Decimal(filters.valor_min)
      }
      if (filters.valor_max) {
        where.valor.lte = new Decimal(filters.valor_max)
      }
    }

    // Filtro de apenas vencidos
    if (filters.apenas_vencidos) {
      where.data_vencimento = { lt: new Date() }
      where.pago = false
    }

    // Filtro de apenas a vencer
    if (filters.apenas_a_vencer) {
      where.data_vencimento = { gte: new Date() }
      where.pago = false
    }

    return where
  }

  /**
   * Lista lançamentos com filtros e paginação
   */
  static async list(
    organizationId: string,
    filters: LancamentoFilters = {}
  ) {
    const page = filters.page || 1
    const limit = Math.min(filters.limit || 20, 100)
    const skip = (page - 1) * limit

    const where = this.buildWhereClause(organizationId, filters)

    const [lancamentos, total] = await Promise.all([
      prisma.lancamento.findMany({
        where,
        include: {
          parceiro: {
            include: {
              pessoa: {
                select: {
                  tipo: true,
                  fisica: {
                    select: { nome: true },
                  },
                  juridica: {
                    select: { nome_fantasia: true },
                  },
                },
              },
            },
          },
          conta_bancaria: {
            select: {
              id: true,
              nome: true,
            },
          },
          categoria: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },
          centro_custo: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: filters.orderBy === 'data' 
          ? { data: filters.order === 'asc' ? 'asc' : 'desc' }
          : { data: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lancamento.count({ where }),
    ])

    const pages = Math.ceil(total / limit)

    return {
      lancamentos: lancamentos.map((l: any) => ({
        ...l,
        valor: l.valor.toNumber(),
        valor_pago: l.valor_pago?.toNumber() ?? null,
        parceiro_nome:
          l.parceiro?.pessoa.tipo === 'F'
            ? l.parceiro?.pessoa.fisica?.nome
            : l.parceiro?.pessoa.juridica?.nome_fantasia,
      })),
      pagination: {
        total,
        pages,
        current_page: page,
        per_page: limit,
      },
    }
  }

  /**
   * Busca um lançamento por ID
   */
  static async findById(lancamentoId: string, organizationId: string) {
    const lancamento = await prisma.lancamento.findFirst({
      where: {
        id: lancamentoId,
        organization_id: organizationId,
      },
      include: {
        parceiro: {
          include: {
            pessoa: {
              select: {
                tipo: true,
                fisica: {
                  select: { nome: true },
                },
                juridica: {
                  select: { nome_fantasia: true },
                },
              },
            },
          },
        },
        conta_bancaria: true,
        categoria: true,
        centro_custo: true,
        parcelas: {
          orderBy: { numero_parcela: 'asc' },
        },
        documentos: true,
      },
    })

    if (!lancamento) {
      throw new BadRequestError('Lançamento não encontrado.')
    }

    return {
      ...lancamento,
      valor: lancamento.valor.toNumber(),
      valor_pago: lancamento.valor_pago?.toNumber() ?? null,
      parceiro_nome:
        lancamento.parceiro?.pessoa.tipo === 'F'
          ? lancamento.parceiro?.pessoa.fisica?.nome
          : lancamento.parceiro?.pessoa.juridica?.nome_fantasia,
      parcelas: lancamento.parcelas.map((p) => ({
        ...p,
        valor: p.valor.toNumber(),
        valorPago: p.valorPago?.toNumber() ?? null,
      })),
    }
  }

  /**
   * Valida registros relacionados
   */
  private static async validateRelatedRecords(
    organizationId: string,
    data: CreateLancamentoData | UpdateLancamentoData
  ) {
    const validations = []

    if (data.categoria_id) {
      validations.push(
        prisma.categoriaFinanceira
          .findFirst({
            where: {
              id: data.categoria_id,
              organization_id: organizationId,
            },
          })
          .then((result) => {
            if (!result) {
              throw new BadRequestError('Categoria financeira não encontrada.')
            }
            return result
          })
      )
    }

    if (data.conta_bancaria_id) {
      validations.push(
        prisma.contaBancaria
          .findFirst({
            where: {
              id: data.conta_bancaria_id,
              organization_id: organizationId,
            },
          })
          .then((result) => {
            if (!result) {
              throw new BadRequestError('Conta bancária não encontrada.')
            }
            return result
          })
      )
    }

    if (data.centro_custo_id) {
      validations.push(
        prisma.centroCusto
          .findFirst({
            where: {
              id: data.centro_custo_id,
              organization_id: organizationId,
            },
          })
          .then((result) => {
            if (!result) {
              throw new BadRequestError('Centro de custo não encontrado.')
            }
            return result
          })
      )
    }

    if (data.parceiro_id) {
      validations.push(
        prisma.parceiro
          .findFirst({
            where: {
              id: data.parceiro_id,
              organization_id: organizationId,
            },
          })
          .then((result) => {
            if (!result) {
              throw new BadRequestError('Parceiro não encontrado.')
            }
            return result
          })
      )
    }

    await Promise.all(validations)
  }

  /**
   * Cria um novo lançamento (único, parcelado ou recorrente)
   */
  static async create(organizationId: string, data: CreateLancamentoData) {
    await this.validateRelatedRecords(organizationId, data)

    const tipoRepeticao = data.tipo_repeticao || 'NENHUMA'

    if (tipoRepeticao === 'PARCELADO') {
      return this.createLancamentoParcelado(organizationId, data)
    } else if (tipoRepeticao === 'RECORRENTE') {
      return this.createLancamentoRecorrente(organizationId, data)
    } else {
      return this.createLancamentoUnico(organizationId, data)
    }
  }

  /**
   * Cria um lançamento único
   */
  private static async createLancamentoUnico(
    organizationId: string,
    data: CreateLancamentoData
  ) {
    const dataLancamento = data.data.split('T')[0]!

    const lancamento = await prisma.lancamento.create({
      data: {
        numero: data.numero,
        tipo: data.tipo,
        data: new Date(dataLancamento),
        data_vencimento: data.data_vencimento
          ? new Date(data.data_vencimento)
          : null,
        data_competencia: data.data_competencia || null,
        descricao: data.descricao,
        observacoes: data.observacoes ?? null,
        valor: new Decimal(data.valor),
        valor_pago: data.valor_pago ? new Decimal(data.valor_pago) : null,
        forma_parcelamento: data.forma_parcelamento,
        numero_parcelas: data.numero_parcelas,
        status_lancamento: data.status_lancamento,
        pago: data.pago,
        data_pagamento: data.data_pagamento
          ? new Date(data.data_pagamento)
          : null,
        tipo_repeticao: 'NENHUMA',
        organization_id: organizationId,
        categoria_id: data.categoria_id,
        conta_bancaria_id: data.conta_bancaria_id,
        centro_custo_id: data.centro_custo_id ?? null,
        parceiro_id: data.parceiro_id ?? null,
      },
    })

    return lancamento
  }

  /**
   * Cria um lançamento parcelado
   */
  private static async createLancamentoParcelado(
    organizationId: string,
    data: CreateLancamentoData
  ) {
    const numeroParcelas = data.numero_parcelas || 1
    const valorTotal = new Decimal(data.valor)
    const valorParcela = valorTotal.dividedBy(numeroParcelas)
    const dataVencimento = data.data_vencimento ? new Date(data.data_vencimento) : new Date()

    // Criar lançamento origem
    const lancamentoOrigem = await prisma.lancamento.create({
      data: {
        numero: data.numero,
        tipo: data.tipo,
        data: new Date(data.data.split('T')[0]!),
        data_vencimento: dataVencimento,
        descricao: data.descricao,
        observacoes: data.observacoes ?? null,
        valor: valorTotal,
        forma_parcelamento: data.forma_parcelamento,
        numero_parcelas: numeroParcelas,
        status_lancamento: data.status_lancamento,
        tipo_repeticao: 'PARCELADO',
        parcela_atual: 1,
        organization_id: organizationId,
        categoria_id: data.categoria_id,
        conta_bancaria_id: data.conta_bancaria_id,
        centro_custo_id: data.centro_custo_id ?? null,
        parceiro_id: data.parceiro_id ?? null,
      },
    })

    // Criar parcelas
    const parcelas = []
    for (let i = 1; i <= numeroParcelas; i++) {
      const dataVencimentoParcela = new Date(dataVencimento)
      dataVencimentoParcela.setMonth(dataVencimentoParcela.getMonth() + (i - 1))

      const parcela = await prisma.lancamento.create({
        data: {
          numero: `${data.numero}-${i}/${numeroParcelas}`,
          tipo: data.tipo,
          data: new Date(data.data.split('T')[0]!),
          data_vencimento: dataVencimentoParcela,
          descricao: `${data.descricao} - Parcela ${i}/${numeroParcelas}`,
          observacoes: data.observacoes ?? null,
          valor: valorParcela,
          forma_parcelamento: data.forma_parcelamento,
          numero_parcelas: numeroParcelas,
          status_lancamento: 'PENDENTE',
          tipo_repeticao: 'PARCELADO',
          parcela_atual: i,
          lancamento_origem_id: lancamentoOrigem.id,
          organization_id: organizationId,
          categoria_id: data.categoria_id,
          conta_bancaria_id: data.conta_bancaria_id,
          centro_custo_id: data.centro_custo_id ?? null,
          parceiro_id: data.parceiro_id ?? null,
        },
      })
      parcelas.push(parcela)
    }

    return lancamentoOrigem
  }

  /**
   * Cria um lançamento recorrente
   */
  private static async createLancamentoRecorrente(
    organizationId: string,
    data: CreateLancamentoData
  ) {
    if (!data.periodicidade) {
      throw new BadRequestError('Periodicidade é obrigatória para lançamentos recorrentes.')
    }

    // Criar configuração de recorrência
    const lancamentoRecorrente = await prisma.lancamentoRecorrente.create({
      data: {
        tipo: data.tipo,
        descricao: data.descricao,
        valor: new Decimal(data.valor),
        periodicidade: data.periodicidade,
        data_inicio: new Date(data.data_vencimento || data.data),
        data_fim: data.data_fim_repeticao ? new Date(data.data_fim_repeticao) : null,
        dia_vencimento: data.data_vencimento ? new Date(data.data_vencimento).getDate() : null,
        organization_id: organizationId,
        categoria_id: data.categoria_id,
        conta_bancaria_id: data.conta_bancaria_id,
        centro_custo_id: data.centro_custo_id ?? null,
        parceiro_id: data.parceiro_id ?? null,
        ativo: true,
      },
    })

    // Criar primeiro lançamento
    const primeiroLancamento = await prisma.lancamento.create({
      data: {
        numero: data.numero,
        tipo: data.tipo,
        data: new Date(data.data.split('T')[0]!),
        data_vencimento: data.data_vencimento ? new Date(data.data_vencimento) : null,
        descricao: data.descricao,
        observacoes: data.observacoes ?? null,
        valor: new Decimal(data.valor),
        status_lancamento: data.status_lancamento,
        tipo_repeticao: 'RECORRENTE',
        periodicidade: data.periodicidade,
        lancamento_recorrente_id: lancamentoRecorrente.id,
        organization_id: organizationId,
        categoria_id: data.categoria_id,
        conta_bancaria_id: data.conta_bancaria_id,
        centro_custo_id: data.centro_custo_id ?? null,
        parceiro_id: data.parceiro_id ?? null,
      },
    })

    return primeiroLancamento
  }

  /**
   * Atualiza um lançamento existente
   */
  static async update(
    lancamentoId: string,
    organizationId: string,
    data: UpdateLancamentoData
  ) {
    const lancamentoExistente = await prisma.lancamento.findFirst({
      where: {
        id: lancamentoId,
        organization_id: organizationId,
      },
    })

    if (!lancamentoExistente) {
      throw new BadRequestError('Lançamento não encontrado.')
    }

    await this.validateRelatedRecords(organizationId, data)

    const updateData: Prisma.LancamentoUncheckedUpdateInput = {}

    if (data.numero !== undefined) updateData.numero = data.numero
    if (data.tipo !== undefined) updateData.tipo = data.tipo
    if (data.data !== undefined) {
      const dataLancamento = data.data.split('T')[0]!
      updateData.data = new Date(dataLancamento)
    }
    if (data.data_vencimento !== undefined) {
      updateData.data_vencimento = data.data_vencimento
        ? new Date(data.data_vencimento)
        : null
    }
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.observacoes !== undefined)
      updateData.observacoes = data.observacoes ?? null
    if (data.valor !== undefined) updateData.valor = new Decimal(data.valor)
    if (data.valor_pago !== undefined)
      updateData.valor_pago = data.valor_pago ? new Decimal(data.valor_pago) : null
    if (data.forma_parcelamento !== undefined)
      updateData.forma_parcelamento = data.forma_parcelamento
    if (data.numero_parcelas !== undefined)
      updateData.numero_parcelas = data.numero_parcelas
    if (data.status_lancamento !== undefined)
      updateData.status_lancamento = data.status_lancamento
    if (data.pago !== undefined) updateData.pago = data.pago
    if (data.data_pagamento !== undefined)
      updateData.data_pagamento = data.data_pagamento
        ? new Date(data.data_pagamento)
        : null
    if (data.categoria_id !== undefined)
      updateData.categoria_id = data.categoria_id
    if (data.conta_bancaria_id !== undefined)
      updateData.conta_bancaria_id = data.conta_bancaria_id
    if (data.centro_custo_id !== undefined)
      updateData.centro_custo_id = data.centro_custo_id ?? null
    if (data.parceiro_id !== undefined)
      updateData.parceiro_id = data.parceiro_id ?? null

    const lancamento = await prisma.lancamento.update({
      where: { id: lancamentoId },
      data: updateData,
    })

    return lancamento
  }

  /**
   * Deleta um lançamento
   */
  static async delete(lancamentoId: string, organizationId: string) {
    const lancamento = await prisma.lancamento.findFirst({
      where: {
        id: lancamentoId,
        organization_id: organizationId,
      },
    })

    if (!lancamento) {
      throw new BadRequestError('Lançamento não encontrado.')
    }

    await prisma.lancamento.delete({
      where: { id: lancamentoId },
    })
  }

  /**
   * Obtém estatísticas de lançamentos
   */
  static async getStatistics(
    organizationId: string,
    filters: Omit<LancamentoFilters, 'page' | 'limit'> = {}
  ) {
    const where = this.buildWhereClause(organizationId, filters)

    const [totalReceitas, totalDespesas, totalPendentes, totalPagos] =
      await Promise.all([
        prisma.lancamento.aggregate({
          where: { ...where, tipo: 'RECEITA' },
          _sum: { valor: true },
        }),
        prisma.lancamento.aggregate({
          where: { ...where, tipo: 'DESPESA' },
          _sum: { valor: true },
        }),
        prisma.lancamento.count({
          where: { ...where, pago: false },
        }),
        prisma.lancamento.count({
          where: { ...where, pago: true },
        }),
      ])

    return {
      total_receitas: totalReceitas._sum.valor?.toNumber() ?? 0,
      total_despesas: totalDespesas._sum.valor?.toNumber() ?? 0,
      saldo: (totalReceitas._sum.valor?.toNumber() ?? 0) -
        (totalDespesas._sum.valor?.toNumber() ?? 0),
      total_pendentes: totalPendentes,
      total_pagos: totalPagos,
    }
  }
}