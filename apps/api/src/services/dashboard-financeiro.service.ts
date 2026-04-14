import { prisma } from '@/lib/prisma'

export class DashboardFinanceiroService {
  async getResumo(organizationId: string) {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    const [receitasMes, despesasMes, parceirosTotal, funcionariosAtivos, lancamentosRecentes, folhaMes] =
      await Promise.all([
        prisma.lancamento.aggregate({
          where: {
            organization_id: organizationId,
            tipo: 'RECEITA',
            data: { gte: monthStart, lte: monthEnd },
          },
          _sum: { valor: true },
        }),
        prisma.lancamento.aggregate({
          where: {
            organization_id: organizationId,
            tipo: 'DESPESA',
            data: { gte: monthStart, lte: monthEnd },
          },
          _sum: { valor: true },
        }),
        prisma.parceiro.count({ where: { organization_id: organizationId } }),
        (prisma as any).funcionario.count({ where: { organization_id: organizationId, ativo: true } }),
        prisma.lancamento.findMany({
          where: { organization_id: organizationId },
          include: { categoria: { select: { nome: true } } },
          orderBy: { created_at: 'desc' },
          take: 8,
        }),
        (prisma as any).folhaPagamento.findFirst({
          where: {
            organization_id: organizationId,
            referencia_mes: today.getMonth() + 1,
            referencia_ano: today.getFullYear(),
          },
        }),
      ])

    const receita = Number(receitasMes._sum.valor ?? 0)
    const despesa = Number(despesasMes._sum.valor ?? 0)
    const folhaLiquida = Number(folhaMes?.total_liquido ?? 0)

    return {
      kpis: {
        receita_mes: receita,
        despesa_mes: despesa,
        saldo_mes: receita - despesa,
        folha_liquida_mes: folhaLiquida,
        total_parceiros: parceirosTotal,
        total_funcionarios_ativos: funcionariosAtivos,
      },
      latest_lancamentos: lancamentosRecentes.map((l) => ({
        ...l,
        valor: Number(l.valor),
      })),
    }
  }

  async getSeries(organizationId: string, months = 12) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

    const [lancamentos, categorias, folhas] = await Promise.all([
      prisma.lancamento.findMany({
        where: {
          organization_id: organizationId,
          data: { gte: start },
          tipo: { in: ['RECEITA', 'DESPESA'] },
        },
        select: { tipo: true, valor: true, data: true },
      }),
      prisma.lancamento.groupBy({
        by: ['categoria_id'],
        where: {
          organization_id: organizationId,
          tipo: { in: ['RECEITA', 'DESPESA'] },
        },
        _sum: { valor: true },
        _count: { _all: true },
      }),
      (prisma as any).folhaPagamento.groupBy({
        by: ['status'],
        where: { organization_id: organizationId },
        _count: { _all: true },
      }),
    ])

    const map = new Map<string, { mes: string; receitas: number; despesas: number; saldo: number }>()
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      map.set(key, { mes: key, receitas: 0, despesas: 0, saldo: 0 })
    }

    for (const l of lancamentos as any[]) {
      const key = `${String(l.data.getMonth() + 1).padStart(2, '0')}/${l.data.getFullYear()}`
      const item = map.get(key)
      if (!item) continue
      const valor = Number(l.valor)
      if (l.tipo === 'RECEITA') item.receitas += valor
      if (l.tipo === 'DESPESA') item.despesas += valor
      item.saldo = item.receitas - item.despesas
    }

    const categoriasDetalhe = await Promise.all(
      (categorias as any[]).map(async (item: any) => {
        const categoria = await prisma.categoriaFinanceira.findUnique({
          where: { id: item.categoria_id },
          select: { nome: true, tipo: true },
        })

        return {
          categoria_id: item.categoria_id,
          categoria_nome: categoria?.nome ?? 'Sem categoria',
          tipo: categoria?.tipo ?? 'DESPESA',
          total: Number(item._sum.valor ?? 0),
          quantidade: item._count._all,
        }
      }),
    )

    return {
      serie_mensal: Array.from(map.values()),
      categorias: categoriasDetalhe.sort((a, b) => b.total - a.total).slice(0, 8),
      status_folha: folhas.map((item: any) => ({
        status: item.status,
        total: item._count._all,
      })),
    }
  }

  async getFolhaResumoMes(organizationId: string, competencia: string) {
    const folha = await (prisma as any).folhaPagamento.findFirst({
      where: { organization_id: organizationId, competencia },
      include: { itens: true },
    })

    if (!folha) {
      return {
        competencia,
        total_proventos: 0,
        total_descontos: 0,
        total_encargos: 0,
        total_liquido: 0,
      }
    }

    const resumoEncargos = folha.itens
      .filter((item: any) => item.natureza === 'ENCARGO')
      .reduce((acc: number, item: any) => acc + Number(item.valor), 0)

    return {
      competencia,
      total_proventos: Number(folha.total_proventos),
      total_descontos: Number(folha.total_descontos),
      total_encargos: Number(folha.total_encargos || resumoEncargos),
      total_liquido: Number(folha.total_liquido),
      status: folha.status,
    }
  }
}
