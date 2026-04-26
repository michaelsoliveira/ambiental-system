import {
  NaturezaFolhaItem,
  StatusFolhaPagamento,
  TipoFolhaItem,
  TipoFolhaPagamento,
} from '@prisma/client'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export const folhaCreateSchema = z.object({
  competencia: z.string().regex(/^\d{2}\/\d{4}$/),
  tipo: z.nativeEnum(TipoFolhaPagamento).default(TipoFolhaPagamento.FOLHA_MENSAL),
  observacoes: z.string().optional(),
})

export const folhaItemCreateSchema = z.object({
  funcionario_id: z.string().uuid(),
  rubrica_id: z.string().uuid(),
  codigo: z.string().max(30).optional(),
  descricao: z.string().max(255).optional(),
  referencia: z.string().max(100).optional(),
  valor: z.coerce.number().nonnegative(),
})

type RubricaSeed = {
  nome: string
  tipo_folha: TipoFolhaPagamento
  tipo_item: TipoFolhaItem
  natureza: NaturezaFolhaItem
  ordem: number
}

const DEFAULT_RUBRICAS: RubricaSeed[] = [
  { nome: 'Salário', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.SALARIO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 10 },
  { nome: 'Ajuda de custo', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.BENEFICIO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 20 },
  { nome: 'INSS', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.INSS, natureza: NaturezaFolhaItem.DESCONTO, ordem: 30 },
  { nome: 'FGTS', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.FGTS, natureza: NaturezaFolhaItem.ENCARGO, ordem: 40 },
  { nome: 'Hora extra 50%', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.HORA_EXTRA, natureza: NaturezaFolhaItem.PROVENTO, ordem: 50 },
  { nome: 'Hora extra 100%', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.HORA_EXTRA, natureza: NaturezaFolhaItem.PROVENTO, ordem: 60 },
  { nome: 'IRRF', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.IRRF, natureza: NaturezaFolhaItem.DESCONTO, ordem: 70 },
  { nome: '13º salário', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 80 },
  { nome: 'Reflexo DSR', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 90 },
  { nome: 'Salário Família', tipo_folha: TipoFolhaPagamento.FOLHA_MENSAL, tipo_item: TipoFolhaItem.BENEFICIO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 100 },

  { nome: 'Férias Proporcionais', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 10 },
  { nome: '13º Férias', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 20 },
  { nome: '1/3 sob férias', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 30 },
  { nome: 'Aviso Prévio indenizado', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 40 },
  { nome: 'INSS sob férias', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.INSS, natureza: NaturezaFolhaItem.DESCONTO, ordem: 50 },
  { nome: 'FGTS sob férias', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.FGTS, natureza: NaturezaFolhaItem.ENCARGO, ordem: 60 },
  { nome: 'IRRF sob férias', tipo_folha: TipoFolhaPagamento.FERIAS, tipo_item: TipoFolhaItem.IRRF, natureza: NaturezaFolhaItem.DESCONTO, ordem: 70 },

  { nome: '1ª Parcela 13º', tipo_folha: TipoFolhaPagamento.DECIMO_TERCEIRO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 10 },
  { nome: '2ª Parcela 13º', tipo_folha: TipoFolhaPagamento.DECIMO_TERCEIRO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 20 },
  { nome: 'Adiantamento 13º', tipo_folha: TipoFolhaPagamento.DECIMO_TERCEIRO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 30 },
  { nome: 'INSS sob 13º', tipo_folha: TipoFolhaPagamento.DECIMO_TERCEIRO, tipo_item: TipoFolhaItem.INSS, natureza: NaturezaFolhaItem.DESCONTO, ordem: 40 },
  { nome: 'FGTS sob 13º', tipo_folha: TipoFolhaPagamento.DECIMO_TERCEIRO, tipo_item: TipoFolhaItem.FGTS, natureza: NaturezaFolhaItem.ENCARGO, ordem: 50 },

  { nome: 'Saldo dias Trabalhados', tipo_folha: TipoFolhaPagamento.RESCISAO, tipo_item: TipoFolhaItem.SALARIO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 10 },
  { nome: 'Ajuste de saldo devedor', tipo_folha: TipoFolhaPagamento.RESCISAO, tipo_item: TipoFolhaItem.DESCONTO, natureza: NaturezaFolhaItem.DESCONTO, ordem: 20 },
  { nome: 'Aviso Prévio Indenizado', tipo_folha: TipoFolhaPagamento.RESCISAO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 30 },
  { nome: 'Férias proporcionais', tipo_folha: TipoFolhaPagamento.RESCISAO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 40 },
  { nome: '13º salário Proporcional', tipo_folha: TipoFolhaPagamento.RESCISAO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 50 },
  { nome: 'Terço constitucional de Férias', tipo_folha: TipoFolhaPagamento.RESCISAO, tipo_item: TipoFolhaItem.OUTRO, natureza: NaturezaFolhaItem.PROVENTO, ordem: 60 },
]

export class FolhaPagamentoService {
  private static parseCompetencia(competencia: string) {
    const [mes, ano] = competencia.split('/')
    return { referencia_mes: Number(mes), referencia_ano: Number(ano) }
  }

  private static toNumber(value: any) {
    return value ? Number(value) : 0
  }

  private static computeTotals(items: Array<{ natureza: NaturezaFolhaItem; valor: any }>) {
    let total_proventos = 0
    let total_descontos = 0
    let total_encargos = 0

    for (const item of items) {
      const valor = Number(item.valor)
      if (item.natureza === NaturezaFolhaItem.PROVENTO) total_proventos += valor
      if (item.natureza === NaturezaFolhaItem.DESCONTO) total_descontos += valor
      if (item.natureza === NaturezaFolhaItem.ENCARGO) total_encargos += valor
    }

    return {
      total_proventos,
      total_descontos,
      total_encargos,
      total_liquido: total_proventos - total_descontos,
    }
  }

  async ensureDefaultRubricas(organizationId: string) {
    await prisma.$transaction(
      DEFAULT_RUBRICAS.map((rubrica) =>
        prisma.rubricaFolha.upsert({
          where: {
            organization_id_tipo_folha_nome: {
              organization_id: organizationId,
              tipo_folha: rubrica.tipo_folha,
              nome: rubrica.nome,
            },
          },
          update: {},
          create: {
            organization_id: organizationId,
            ...rubrica,
          },
        }),
      ),
    )
  }

  async listRubricas(organizationId: string, params: Record<string, any>) {
    await this.ensureDefaultRubricas(organizationId)
    return prisma.rubricaFolha.findMany({
      where: {
        organization_id: organizationId,
        ativo: true,
        ...(params.tipo_folha ? { tipo_folha: params.tipo_folha } : {}),
      },
      orderBy: [{ tipo_folha: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }],
    })
  }

  async list(organizationId: string, params: Record<string, any>) {
    const page = Number(params.page || 1)
    const limit = Math.min(Number(params.limit || 50), 1000)
    const skip = (page - 1) * limit
    const where: any = {
      organization_id: organizationId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.competencia ? { competencia: params.competencia } : {}),
      ...(params.tipo ? { tipo: params.tipo } : {}),
    }

    const [data, count] = await Promise.all([
      prisma.folhaPagamento.findMany({
        where,
        include: {
          _count: { select: { itens: true } },
        },
        orderBy: [{ referencia_ano: 'desc' }, { referencia_mes: 'desc' }, { tipo: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.folhaPagamento.count({ where }),
    ])

    return {
      data: data.map((folha) => ({
        ...folha,
        total_proventos: FolhaPagamentoService.toNumber(folha.total_proventos),
        total_descontos: FolhaPagamentoService.toNumber(folha.total_descontos),
        total_encargos: FolhaPagamentoService.toNumber(folha.total_encargos),
        total_liquido: FolhaPagamentoService.toNumber(folha.total_liquido),
      })),
      pagination: {
        count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
        has_next: page * limit < count,
        has_prev: page > 1,
      },
    }
  }

  async getRelatorio(organizationId: string, params: Record<string, any>) {
    const itemWhere: any = {
      organization_id: organizationId,
      ...(params.funcionario_id ? { funcionario_id: params.funcionario_id } : {}),
      ...(params.rubrica_id ? { rubrica_id: params.rubrica_id } : {}),
      ...(params.natureza ? { natureza: params.natureza } : {}),
    }
    const hasItemFilters = Boolean(params.funcionario_id || params.rubrica_id || params.natureza)

    const dateRange = (start?: string, end?: string) => {
      if (!start && !end) return undefined
      return {
        ...(start ? { gte: new Date(start) } : {}),
        ...(end ? { lte: new Date(`${end}T23:59:59.999`) } : {}),
      }
    }

    const where: any = {
      organization_id: organizationId,
      ...(params.competencia ? { competencia: params.competencia } : {}),
      ...(params.tipo ? { tipo: params.tipo } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(dateRange(params.data_fechamento_inicio, params.data_fechamento_fim)
        ? { data_fechamento: dateRange(params.data_fechamento_inicio, params.data_fechamento_fim) }
        : {}),
      ...(dateRange(params.data_pagamento_inicio, params.data_pagamento_fim)
        ? { data_pagamento: dateRange(params.data_pagamento_inicio, params.data_pagamento_fim) }
        : {}),
      ...(hasItemFilters ? { itens: { some: itemWhere } } : {}),
    }

    const folhas = await prisma.folhaPagamento.findMany({
      where,
      include: {
        itens: {
          where: itemWhere,
          include: {
            rubrica: true,
            funcionario: {
              include: {
                pessoa: { include: { fisica: true, juridica: true } },
              },
            },
          },
          orderBy: [{ funcionario_id: 'asc' }, { created_at: 'asc' }],
        },
      },
      orderBy: [{ referencia_ano: 'desc' }, { referencia_mes: 'desc' }, { tipo: 'asc' }],
    })

    const totais = {
      total_proventos: 0,
      total_descontos: 0,
      total_encargos: 0,
      total_liquido: 0,
      total_itens: 0,
    }

    const folhasFormatadas = folhas.map((folha) => {
      const itens = folha.itens.map((item) => ({
        ...item,
        valor: Number(item.valor),
      }))
      const totaisFiltrados = FolhaPagamentoService.computeTotals(itens)

      totais.total_proventos += totaisFiltrados.total_proventos
      totais.total_descontos += totaisFiltrados.total_descontos
      totais.total_encargos += totaisFiltrados.total_encargos
      totais.total_liquido += totaisFiltrados.total_liquido
      totais.total_itens += itens.length

      return {
        ...folha,
        total_proventos: FolhaPagamentoService.toNumber(folha.total_proventos),
        total_descontos: FolhaPagamentoService.toNumber(folha.total_descontos),
        total_encargos: FolhaPagamentoService.toNumber(folha.total_encargos),
        total_liquido: FolhaPagamentoService.toNumber(folha.total_liquido),
        totais_filtrados: totaisFiltrados,
        itens,
      }
    })

    return {
      generated_at: new Date().toISOString(),
      filters: params,
      totals: totais,
      folhas: folhasFormatadas,
    }
  }

  async getById(id: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        itens: {
          include: {
            rubrica: true,
            funcionario: {
              include: {
                pessoa: { include: { fisica: true, juridica: true } },
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    })

    if (!folha) return null

    return {
      ...folha,
      total_proventos: FolhaPagamentoService.toNumber(folha.total_proventos),
      total_descontos: FolhaPagamentoService.toNumber(folha.total_descontos),
      total_encargos: FolhaPagamentoService.toNumber(folha.total_encargos),
      total_liquido: FolhaPagamentoService.toNumber(folha.total_liquido),
      itens: folha.itens.map((item) => ({ ...item, valor: Number(item.valor) })),
    }
  }

  async create(data: z.infer<typeof folhaCreateSchema>, organizationId: string) {
    const { referencia_mes, referencia_ano } = FolhaPagamentoService.parseCompetencia(data.competencia)
    const created = await prisma.folhaPagamento.create({
      data: {
        organization_id: organizationId,
        competencia: data.competencia,
        tipo: data.tipo,
        referencia_mes,
        referencia_ano,
        observacoes: data.observacoes ?? null,
      },
    })

    return created.id
  }

  async addItem(
    folhaId: string,
    data: z.infer<typeof folhaItemCreateSchema>,
    organizationId: string,
  ) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id: folhaId, organization_id: organizationId },
    })
    if (!folha) throw new BadRequestError('Folha não encontrada.')
    if (folha.status !== StatusFolhaPagamento.ABERTA) {
      throw new BadRequestError('Só é possível adicionar itens com a folha aberta.')
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: { id: data.funcionario_id, organization_id: organizationId, ativo: true },
    })
    if (!funcionario) throw new BadRequestError('Funcionário não encontrado.')

    const rubrica = await prisma.rubricaFolha.findFirst({
      where: {
        id: data.rubrica_id,
        organization_id: organizationId,
        ativo: true,
      },
    })
    if (!rubrica) throw new BadRequestError('Rubrica não encontrada.')
    if (rubrica.tipo_folha !== folha.tipo) {
      throw new BadRequestError('Rubrica não pertence ao tipo da folha selecionada.')
    }

    await prisma.folhaPagamentoItem.create({
      data: {
        organization_id: organizationId,
        folha_pagamento_id: folhaId,
        funcionario_id: data.funcionario_id,
        rubrica_id: rubrica.id,
        tipo: rubrica.tipo_item,
        natureza: rubrica.natureza,
        codigo: data.codigo ?? rubrica.codigo,
        descricao: data.descricao?.trim() || rubrica.nome,
        referencia: data.referencia ?? null,
        valor: data.valor,
      },
    })

    await this.recalculateTotals(folhaId, organizationId)
  }

  async removeItem(folhaId: string, itemId: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id: folhaId, organization_id: organizationId },
    })
    if (!folha) throw new BadRequestError('Folha não encontrada.')
    if (folha.status !== StatusFolhaPagamento.ABERTA) {
      throw new BadRequestError('Só é possível remover itens com a folha aberta.')
    }

    await prisma.folhaPagamentoItem.deleteMany({
      where: {
        id: itemId,
        folha_pagamento_id: folhaId,
        organization_id: organizationId,
      },
    })
    await this.recalculateTotals(folhaId, organizationId)
  }

  async close(folhaId: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id: folhaId, organization_id: organizationId },
      include: { itens: true },
    })
    if (!folha) throw new BadRequestError('Folha não encontrada.')
    if (folha.status !== StatusFolhaPagamento.ABERTA) {
      throw new BadRequestError('Apenas folhas abertas podem ser fechadas.')
    }
    if (folha.itens.length === 0) {
      throw new BadRequestError('Não é possível fechar uma folha sem itens.')
    }

    await this.recalculateTotals(folhaId, organizationId)
    await prisma.folhaPagamento.update({
      where: { id: folhaId },
      data: { status: StatusFolhaPagamento.FECHADA, data_fechamento: new Date() },
    })
  }

  async reopen(folhaId: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id: folhaId, organization_id: organizationId },
    })
    if (!folha) throw new BadRequestError('Folha não encontrada.')
    if (folha.status !== StatusFolhaPagamento.FECHADA) {
      throw new BadRequestError('Somente folhas fechadas podem ser reabertas.')
    }

    await prisma.folhaPagamento.update({
      where: { id: folhaId },
      data: { status: StatusFolhaPagamento.ABERTA, data_fechamento: null },
    })
  }

  async markAsPaid(folhaId: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id: folhaId, organization_id: organizationId },
    })
    if (!folha) throw new BadRequestError('Folha não encontrada.')
    if (folha.status !== StatusFolhaPagamento.FECHADA) {
      throw new BadRequestError('Somente folhas fechadas podem ser marcadas como pagas.')
    }

    await prisma.folhaPagamento.update({
      where: { id: folhaId },
      data: { status: StatusFolhaPagamento.PAGA, data_pagamento: new Date() },
    })
  }

  async unpay(folhaId: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id: folhaId, organization_id: organizationId },
    })
    if (!folha) throw new BadRequestError('Folha não encontrada.')
    if (folha.status !== StatusFolhaPagamento.PAGA) {
      throw new BadRequestError('Somente folhas pagas podem ter o pagamento estornado.')
    }

    await prisma.folhaPagamento.update({
      where: { id: folhaId },
      data: { status: StatusFolhaPagamento.FECHADA, data_pagamento: null },
    })
  }

  async recalculateTotals(folhaId: string, organizationId: string) {
    const items = await prisma.folhaPagamentoItem.findMany({
      where: { folha_pagamento_id: folhaId, organization_id: organizationId },
      select: { natureza: true, valor: true },
    })

    const totals = FolhaPagamentoService.computeTotals(items)
    await prisma.folhaPagamento.update({
      where: { id: folhaId },
      data: totals,
    })
    return totals
  }
}
