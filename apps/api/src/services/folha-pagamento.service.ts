import { NaturezaFolhaItem, StatusFolhaPagamento, TipoFolhaItem } from '@prisma/client'
import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export const folhaCreateSchema = z.object({
  competencia: z.string().regex(/^\d{2}\/\d{4}$/),
  observacoes: z.string().optional(),
})

export const folhaItemCreateSchema = z.object({
  funcionario_id: z.string().uuid(),
  tipo: z.nativeEnum(TipoFolhaItem),
  natureza: z.nativeEnum(NaturezaFolhaItem),
  codigo: z.string().max(30).optional(),
  descricao: z.string().max(255),
  referencia: z.string().max(100).optional(),
  valor: z.coerce.number().nonnegative(),
})

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

  async list(organizationId: string, params: Record<string, any>) {
    const page = Number(params.page || 1)
    const limit = Math.min(Number(params.limit || 50), 100)
    const skip = (page - 1) * limit
    const where: any = {
      organization_id: organizationId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.competencia ? { competencia: params.competencia } : {}),
    }

    const [data, count] = await Promise.all([
      prisma.folhaPagamento.findMany({
        where,
        include: {
          _count: { select: { itens: true } },
        },
        orderBy: [{ referencia_ano: 'desc' }, { referencia_mes: 'desc' }],
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

  async getById(id: string, organizationId: string) {
    const folha = await prisma.folhaPagamento.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        itens: {
          include: {
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

    await prisma.folhaPagamentoItem.create({
      data: {
        organization_id: organizationId,
        folha_pagamento_id: folhaId,
        funcionario_id: data.funcionario_id,
        tipo: data.tipo,
        natureza: data.natureza,
        codigo: data.codigo ?? null,
        descricao: data.descricao,
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
