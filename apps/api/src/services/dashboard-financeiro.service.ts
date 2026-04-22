import { prisma } from '@/lib/prisma'

/** Filtro opcional de status da folha no relatório (TODAS = sem filtro por status). */
export type FolhaStatusRelatorio = 'TODAS' | 'PAGA' | 'FECHADA' | 'ABERTA' | 'CANCELADA'

function parseCompetencia(competencia: string): { mes: number; ano: number } | null {
  const m = /^(\d{1,2})\/(\d{4})$/.exec(competencia.trim())
  if (!m) return null
  const mes = Number(m[1])
  const ano = Number(m[2])
  if (mes < 1 || mes > 12) return null
  return { mes, ano }
}

function formatCompetencia(mes: number, ano: number) {
  return `${String(mes).padStart(2, '0')}/${ano}`
}

export type DashboardResumoOptions = {
  /** MM/AAAA — quando omitido, usa o mês calendário atual. */
  competencia?: string
  /** Restringe a folha usada no KPI “folha líquida” ao status (ex.: apenas PAGA). */
  folha_status?: FolhaStatusRelatorio
}

export class DashboardFinanceiroService {
  async getResumo(organizationId: string, options?: DashboardResumoOptions) {
    const today = new Date()
    let monthStart: Date
    let monthEnd: Date
    let refMes = today.getMonth() + 1
    let refAno = today.getFullYear()

    const competenciaInput = options?.competencia?.trim()
    if (competenciaInput) {
      const parsed = parseCompetencia(competenciaInput)
      if (parsed) {
        refMes = parsed.mes
        refAno = parsed.ano
        monthStart = new Date(refAno, refMes - 1, 1)
        monthEnd = new Date(refAno, refMes, 0, 23, 59, 59, 999)
      } else {
        monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      }
    } else {
      monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const folhaStatus = options?.folha_status ?? 'TODAS'
    const folhaWhere: Record<string, unknown> = {
      organization_id: organizationId,
      competencia: formatCompetencia(refMes, refAno),
    }
    if (folhaStatus !== 'TODAS') {
      folhaWhere.status = folhaStatus
    }

    const lancamentosWhereBase = {
      organization_id: organizationId,
      data: { gte: monthStart, lte: monthEnd },
    }

    /** Lista rápida: sempre os últimos 8 da organização (sem recorte por competência), para não esvaziar o bloco quando o mês filtrado não tem lançamentos. */
    const latestLancamentosWhere = { organization_id: organizationId }

    const [receitasMes, despesasMes, parceirosTotal, funcionariosAtivos, lancamentosRecentes, folhaMes] =
      await Promise.all([
        prisma.lancamento.aggregate({
          where: {
            ...lancamentosWhereBase,
            tipo: 'RECEITA',
          },
          _sum: { valor: true },
        }),
        prisma.lancamento.aggregate({
          where: {
            ...lancamentosWhereBase,
            tipo: 'DESPESA',
          },
          _sum: { valor: true },
        }),
        prisma.parceiro.count({ where: { organization_id: organizationId } }),
        (prisma as any).funcionario.count({ where: { organization_id: organizationId, ativo: true } }),
        prisma.lancamento.findMany({
          where: latestLancamentosWhere,
          include: { categoria: { select: { nome: true } } },
          orderBy: { created_at: 'desc' },
          take: 8,
        }),
        (prisma as any).folhaPagamento.findFirst({
          where: folhaWhere,
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
      filtros: {
        competencia_aplicada: formatCompetencia(refMes, refAno),
        folha_status: folhaStatus,
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

  async getFolhaResumoMes(
    organizationId: string,
    competencia: string,
    folhaStatus: FolhaStatusRelatorio = 'TODAS',
  ) {
    const where: Record<string, unknown> = { organization_id: organizationId, competencia }
    if (folhaStatus !== 'TODAS') {
      where.status = folhaStatus
    }

    const folha = await (prisma as any).folhaPagamento.findFirst({
      where,
      include: { itens: true },
    })

    if (!folha) {
      return {
        competencia,
        total_proventos: 0,
        total_descontos: 0,
        total_encargos: 0,
        total_liquido: 0,
        status: null,
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
