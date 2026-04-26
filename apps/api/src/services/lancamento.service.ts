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
  veiculo_id?: string
  parceiro_id?: string
  forma_parcelamento?: 'UNICA' | 'FIXA' | 'PROGRESSIVA' | 'RECORRENTE' | 'todos'
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
  forma_parcelamento: 'UNICA' | 'FIXA' | 'PROGRESSIVA' | 'RECORRENTE'
  numero_parcelas: number
  categoria_id: string
  conta_bancaria_id: string
  centro_custo_id?: string
  veiculo_id?: string
  parceiro_id?: string
  pago: boolean
  status_lancamento: 'PENDENTE' | 'CONFIRMADO' | 'PAGO' | 'CANCELADO' | 'ATRASADO'
  valor_pago?: number
  data_pagamento?: string
  // Controle interno e integração Asaas
  controle_interno?: boolean
  gerar_boleto?: boolean
  permitir_pix?: boolean
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
  veiculo?: {
    id: string
    placa: string
    modelo: string
    marca: string
  } | null
}

export class LancamentoService {
  private static addPeriod(date: Date, periodicidade: NonNullable<CreateLancamentoData['periodicidade']>, index: number) {
    const next = new Date(date)
    if (periodicidade === 'DIARIA') next.setDate(next.getDate() + index)
    if (periodicidade === 'SEMANAL') next.setDate(next.getDate() + 7 * index)
    if (periodicidade === 'QUINZENAL') next.setDate(next.getDate() + 15 * index)
    if (periodicidade === 'MENSAL') next.setMonth(next.getMonth() + index)
    if (periodicidade === 'BIMESTRAL') next.setMonth(next.getMonth() + 2 * index)
    if (periodicidade === 'TRIMESTRAL') next.setMonth(next.getMonth() + 3 * index)
    if (periodicidade === 'SEMESTRAL') next.setMonth(next.getMonth() + 6 * index)
    if (periodicidade === 'ANUAL') next.setFullYear(next.getFullYear() + index)
    return next
  }

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

    if (filters.veiculo_id) {
      where.veiculo_id = filters.veiculo_id
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
          veiculo: {
            select: {
              id: true,
              placa: true,
              modelo: true,
              marca: true,
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
        veiculo: {
          select: {
            id: true,
            placa: true,
            modelo: true,
            marca: true,
          },
        },
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

    if (data.veiculo_id) {
      validations.push(
        prisma.veiculo
          .findFirst({
            where: {
              id: data.veiculo_id,
              organization_id: organizationId,
            },
          })
          .then((result) => {
            if (!result) {
              throw new BadRequestError('Veículo não encontrado.')
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

    if (data.forma_parcelamento === 'RECORRENTE' || tipoRepeticao === 'RECORRENTE') {
      return this.createLancamentoRecorrente(organizationId, data)
    } else if (tipoRepeticao === 'PARCELADO') {
      return this.createLancamentoParcelado(organizationId, data)
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
        veiculo_id: data.veiculo_id ?? null,
        controle_interno: data.controle_interno ?? false,
        gerar_boleto: data.gerar_boleto ?? false,
        permitir_pix: data.permitir_pix ?? false,
      },
    })

    // Integração Asaas: criar cobrança quando não for controle interno e for receita
    const deveCriarCobranca =
      !(data.controle_interno ?? false) &&
      data.tipo === 'RECEITA' &&
      ((data.gerar_boleto ?? false) || (data.permitir_pix ?? false))

    if (deveCriarCobranca && data.parceiro_id && data.data_vencimento) {
      try {
        const asaasResult = await this.criarCobrancaAsaas(
          organizationId,
          lancamento,
          data
        )
        if (asaasResult) {
          await prisma.lancamento.update({
            where: { id: lancamento.id },
            data: {
              asaas_payment_id: asaasResult.id,
              invoice_url: asaasResult.invoiceUrl ?? null,
              boleto_url: asaasResult.bankSlipUrl ?? null,
              boleto_linha_digitavel: asaasResult.identificationField ?? null,
              pix_qrcode_url: asaasResult.billingType === 'PIX' ? asaasResult.invoiceUrl ?? null : null,
            },
          })
        }
      } catch (err) {
        console.error('[LancamentoService] Erro ao criar cobrança Asaas:', err)
        // Não falha a criação - lançamento é salvo sem integração
      }
    }

    return prisma.lancamento.findUniqueOrThrow({
      where: { id: lancamento.id },
    })
  }

  private static async criarCobrancaAsaas(
    organizationId: string,
    lancamento: { id: string; valor: any; descricao: string; data_vencimento: Date | null },
    data: CreateLancamentoData
  ): Promise<{ id: string; invoiceUrl?: string; bankSlipUrl?: string; identificationField?: string; billingType: string } | null> {
    const { prisma } = await import('@/lib/prisma')
    const { AsaasService } = await import('@/services/asaas.service')

    const config = await prisma.configuracaoFinanceira.findUnique({
      where: { organization_id: organizationId },
    })
    const asaasApiKey = config?.asaas_api_key ?? process.env.ASAAS_API_KEY
    if (!asaasApiKey) return null

    const parceiro = await prisma.parceiro.findFirst({
      where: { id: data.parceiro_id!, organization_id: organizationId },
      include: {
        pessoa: {
          include: {
            fisica: true,
            juridica: true,
            endereco: true,
          },
        },
      },
    })
    if (!parceiro?.pessoa) return null

    const asaas = new AsaasService(asaasApiKey, (process.env.ASAAS_ENV as 'sandbox' | 'production') || 'sandbox')

    let customerId = parceiro.pessoa.asaas_customer_id
    if (!customerId) {
      const nome = parceiro.pessoa.fisica?.nome ?? parceiro.pessoa.juridica?.nome_fantasia ?? parceiro.pessoa.juridica?.razao_social ?? 'Cliente'
      const cpfCnpj = parceiro.pessoa.fisica?.cpf ?? parceiro.pessoa.juridica?.cnpj ?? undefined
      const { id } = await asaas.criarCliente({
        name: nome,
        email: parceiro.pessoa.email ?? undefined,
        cpfCnpj: cpfCnpj ?? undefined,
        phone: parceiro.pessoa.telefone ?? undefined,
      })
      customerId = id
      await prisma.pessoa.update({
        where: { id: parceiro.pessoa_id },
        data: { asaas_customer_id: id },
      })
    }

    const billingType = (data.gerar_boleto ? 'BOLETO' : 'PIX') as 'BOLETO' | 'PIX'
    const dueDate = (data.data_vencimento ?? '').split('T')[0] || new Date().toISOString().split('T')[0]
    const response = await asaas.criarCobranca({
      customer: customerId,
      value: data.valor,
      dueDate,
      description: data.descricao,
      billingType,
      externalReference: lancamento.id,
    })

    return {
      id: response.id,
      invoiceUrl: response.invoiceUrl,
      bankSlipUrl: response.bankSlipUrl,
      identificationField: response.identificationField,
      billingType: response.billingType,
    }
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
        veiculo_id: data.veiculo_id ?? null,
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
          veiculo_id: data.veiculo_id ?? null,
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
    const periodicidade = data.periodicidade ?? 'MENSAL'
    const numeroParcelas = data.numero_parcelas || 1
    const dataInicio = data.data_vencimento ? new Date(data.data_vencimento) : new Date(data.data)
    const dataFim = data.data_fim_repeticao
      ? new Date(data.data_fim_repeticao)
      : LancamentoService.addPeriod(dataInicio, periodicidade, numeroParcelas - 1)

    // Criar configuração de recorrência
    const lancamentoRecorrente = await prisma.lancamentoRecorrente.create({
      data: {
        tipo: data.tipo,
        descricao: data.descricao,
        valor: new Decimal(data.valor),
        periodicidade,
        data_inicio: dataInicio,
        data_fim: dataFim,
        dia_vencimento: dataInicio.getDate(),
        organization_id: organizationId,
        categoria_id: data.categoria_id,
        conta_bancaria_id: data.conta_bancaria_id,
        centro_custo_id: data.centro_custo_id ?? null,
        parceiro_id: data.parceiro_id ?? null,
        ativo: true,
      },
    })

    let primeiroLancamento: Lancamento | null = null
    for (let i = 1; i <= numeroParcelas; i++) {
      const dataVencimentoParcela = LancamentoService.addPeriod(dataInicio, periodicidade, i - 1)
      const lancamento = await prisma.lancamento.create({
        data: {
          numero: numeroParcelas === 1 ? data.numero : `${data.numero}-${i}/${numeroParcelas}`,
          tipo: data.tipo,
          data: new Date(data.data.split('T')[0]!),
          data_vencimento: dataVencimentoParcela,
          data_competencia: data.data_competencia || null,
          descricao: numeroParcelas === 1 ? data.descricao : `${data.descricao} - Recorrência ${i}/${numeroParcelas}`,
          observacoes: data.observacoes ?? null,
          valor: new Decimal(data.valor),
          valor_pago: i === 1 && data.valor_pago ? new Decimal(data.valor_pago) : null,
          pago: i === 1 ? data.pago : false,
          data_pagamento: i === 1 && data.data_pagamento ? new Date(data.data_pagamento) : null,
          forma_parcelamento: 'RECORRENTE',
          numero_parcelas: numeroParcelas,
          status_lancamento: i === 1 ? data.status_lancamento : 'PENDENTE',
          tipo_repeticao: 'RECORRENTE',
          periodicidade,
          data_fim_repeticao: dataFim,
          parcela_atual: i,
          lancamento_recorrente_id: lancamentoRecorrente.id,
          organization_id: organizationId,
          categoria_id: data.categoria_id,
          conta_bancaria_id: data.conta_bancaria_id,
          centro_custo_id: data.centro_custo_id ?? null,
          parceiro_id: data.parceiro_id ?? null,
          veiculo_id: data.veiculo_id ?? null,
          controle_interno: data.controle_interno ?? false,
          gerar_boleto: data.gerar_boleto ?? false,
          permitir_pix: data.permitir_pix ?? false,
        },
      })

      if (!primeiroLancamento) primeiroLancamento = lancamento
    }

    return primeiroLancamento!
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
    if (data.veiculo_id !== undefined)
      updateData.veiculo_id = data.veiculo_id ?? null

    const lancamento = await prisma.lancamento.update({
      where: { id: lancamentoId },
      data: updateData,
    })

    await LancamentoService.syncFrotaValorFromLancamento(
      lancamento.id,
      lancamento.valor,
    )

    return lancamento
  }

  /**
   * Mantém o valor espelhado em abastecimento / manutenção / viagem alinhado ao lançamento (fonte financeira).
   */
  private static async syncFrotaValorFromLancamento(
    lancamentoId: string,
    valor: Decimal,
  ) {
    await prisma.$transaction([
      prisma.abastecimento.updateMany({
        where: { lancamento_id: lancamentoId },
        data: { valor },
      }),
      prisma.manutencao.updateMany({
        where: { lancamento_id: lancamentoId },
        data: { valor },
      }),
      prisma.viagem.updateMany({
        where: { lancamento_id: lancamentoId },
        data: { valor },
      }),
    ])
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