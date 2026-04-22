import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import {
  CreateLancamentoData,
  LancamentoService,
} from '@/services/lancamento.service'

function numeroOperacao(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Domínio operacional de frota: registros de abastecimento, manutenção e viagem
 * sempre vinculados a um {@link Lancamento} (fonte única de valor no financeiro).
 */
export class FrotaService {
  private static validateReceitaLancamentoInput(input: {
    valorReceita?: number | null
    categoriaId?: string
    contaBancariaId?: string
  }) {
    const hasValor = input.valorReceita != null && input.valorReceita > 0
    const hasCategoria = !!input.categoriaId
    const hasConta = !!input.contaBancariaId

    if (hasValor && (!hasCategoria || !hasConta)) {
      throw new BadRequestError(
        'Para gerar lançamento de receita, informe categoria e conta bancária.',
      )
    }
  }

  private static buildRecurrenceDates(
    start: Date,
    end: Date,
    weekdays: number[],
  ): Date[] {
    const byDay = new Set(weekdays)
    const dates: Date[] = []

    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)
    const endDay = new Date(end)
    endDay.setHours(23, 59, 59, 999)

    while (cursor <= endDay) {
      if (byDay.has(cursor.getDay())) {
        dates.push(new Date(cursor))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    return dates
  }

  private static normalizeInterval(inicio: Date, fim?: Date | null) {
    const start = new Date(inicio)
    const end = fim ? new Date(fim) : new Date(inicio)
    if (end < start) {
      throw new BadRequestError('Data final deve ser maior ou igual à data inicial.')
    }
    return { start, end }
  }

  private static async assertSemConflitoComDisponibilidade(
    organizationId: string,
    veiculoId: string,
    inicio: Date,
    fim?: Date | null,
  ) {
    const { start, end } = this.normalizeInterval(inicio, fim)
    const conflito = await prisma.veiculoDisponibilidade.findFirst({
      where: {
        organization_id: organizationId,
        veiculo_id: veiculoId,
        inicio: { lte: end },
        fim: { gte: start },
      },
      orderBy: { inicio: 'asc' },
    })

    if (conflito) {
      throw new BadRequestError(
        `Conflito com disponibilidade do veículo (${conflito.tipo}) entre ${conflito.inicio.toISOString()} e ${conflito.fim.toISOString()}.`,
      )
    }
  }

  private static async assertSemConflitoComViagem(
    organizationId: string,
    veiculoId: string,
    inicio: Date,
    fim?: Date | null,
    ignoreViagemId?: string,
  ) {
    const { start, end } = this.normalizeInterval(inicio, fim)
    const conflito = await prisma.viagem.findFirst({
      where: {
        veiculo: {
          id: veiculoId,
          organization_id: organizationId,
        },
        ...(ignoreViagemId ? { id: { not: ignoreViagemId } } : {}),
        data_inicio: { lte: end },
        OR: [{ data_fim: null }, { data_fim: { gte: start } }],
      },
      orderBy: { data_inicio: 'asc' },
    })

    if (conflito) {
      throw new BadRequestError(
        `Existe viagem no período informado (${conflito.origem} → ${conflito.destino}).`,
      )
    }
  }

  private static async assertSemConflitoEntreDisponibilidades(
    organizationId: string,
    veiculoId: string,
    inicio: Date,
    fim: Date,
    ignoreId?: string,
  ) {
    const conflito = await prisma.veiculoDisponibilidade.findFirst({
      where: {
        organization_id: organizationId,
        veiculo_id: veiculoId,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        inicio: { lte: fim },
        fim: { gte: inicio },
      },
      orderBy: { inicio: 'asc' },
    })
    if (conflito) {
      throw new BadRequestError(
        `Já existe disponibilidade no período (${conflito.tipo}) entre ${conflito.inicio.toISOString()} e ${conflito.fim.toISOString()}.`,
      )
    }
  }

  private static buildLancamentoBase(
    veiculo: { id: string; placa: string },
    input: {
      data: Date
      valor: number
      descricao: string
      tipo: 'DESPESA' | 'RECEITA'
      categoriaId: string
      contaBancariaId: string
      centroCustoId?: string | null
      pago?: boolean
    }
  ): CreateLancamentoData {
    const pago = input.pago ?? false
    const payload: CreateLancamentoData = {
      numero: numeroOperacao(input.tipo === 'DESPESA' ? 'FRT-D' : 'FRT-R'),
      tipo: input.tipo,
      data: input.data.toISOString(),
      descricao: input.descricao,
      valor: input.valor,
      forma_parcelamento: 'UNICA',
      numero_parcelas: 1,
      categoria_id: input.categoriaId,
      conta_bancaria_id: input.contaBancariaId,
      centro_custo_id: input.centroCustoId ?? undefined,
      veiculo_id: veiculo.id,
      pago,
      status_lancamento: pago ? 'PAGO' : 'PENDENTE',
    }
    if (pago) {
      payload.data_pagamento = input.data.toISOString()
      payload.valor_pago = input.valor
    }
    return payload
  }

  static async registrarAbastecimento(
    organizationId: string,
    input: {
      veiculoId: string
      data: Date
      litros: number
      valor: number
      km?: number | null
      categoriaId: string
      contaBancariaId: string
      centroCustoId?: string | null
      pago?: boolean
    }
  ) {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: input.veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')

    const lanc = await LancamentoService.create(
      organizationId,
      FrotaService.buildLancamentoBase(veiculo, {
        data: input.data,
        valor: input.valor,
        descricao: `Abastecimento — ${veiculo.placa}`,
        tipo: 'DESPESA',
        categoriaId: input.categoriaId,
        contaBancariaId: input.contaBancariaId,
        centroCustoId: input.centroCustoId,
        pago: input.pago,
      })
    )

    const abastecimento = await prisma.abastecimento.create({
      data: {
        veiculo_id: veiculo.id,
        data: input.data,
        litros: input.litros,
        valor: new Decimal(input.valor),
        km: input.km ?? null,
        lancamento_id: lanc.id,
      },
    })

    if (input.km != null) {
      await prisma.veiculo.update({
        where: { id: veiculo.id },
        data: { km_atual: input.km },
      })
    }

    return { abastecimento, lancamentoId: lanc.id }
  }

  static async registrarManutencao(
    organizationId: string,
    input: {
      veiculoId: string
      tipo: string
      descricao?: string | null
      data: Date
      valor: number
      categoriaId: string
      contaBancariaId: string
      centroCustoId?: string | null
      pago?: boolean
    }
  ) {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: input.veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')

    const lanc = await LancamentoService.create(
      organizationId,
      FrotaService.buildLancamentoBase(veiculo, {
        data: input.data,
        valor: input.valor,
        descricao: `Manutenção (${input.tipo}) — ${veiculo.placa}`,
        tipo: 'DESPESA',
        categoriaId: input.categoriaId,
        contaBancariaId: input.contaBancariaId,
        centroCustoId: input.centroCustoId,
        pago: input.pago,
      })
    )

    const manutencao = await prisma.manutencao.create({
      data: {
        veiculo_id: veiculo.id,
        tipo: input.tipo,
        descricao: input.descricao ?? null,
        data: input.data,
        valor: new Decimal(input.valor),
        lancamento_id: lanc.id,
      },
    })

    return { manutencao, lancamentoId: lanc.id }
  }

  /**
   * Registra viagem e receita (frete/transporte). Sem valor financeiro, apenas persiste a viagem.
   */
  static async registrarViagemComReceita(
    organizationId: string,
    input: {
      veiculoId: string
      origem: string
      destino: string
      dataInicio: Date
      dataFim?: Date | null
      kmRodado?: number | null
      valorReceita?: number | null
      categoriaId?: string
      contaBancariaId?: string
      centroCustoId?: string | null
      pago?: boolean
    }
  ) {
    this.validateReceitaLancamentoInput(input)

    const veiculo = await prisma.veiculo.findFirst({
      where: { id: input.veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')
    await this.assertSemConflitoComDisponibilidade(
      organizationId,
      veiculo.id,
      input.dataInicio,
      input.dataFim ?? null,
    )

    let lancamentoId: string | null = null

    if (
      input.valorReceita != null &&
      input.valorReceita > 0 &&
      input.categoriaId &&
      input.contaBancariaId
    ) {
      const lanc = await LancamentoService.create(
        organizationId,
        FrotaService.buildLancamentoBase(veiculo, {
          data: input.dataInicio,
          valor: input.valorReceita,
          descricao: `Receita de viagem ${input.origem} → ${input.destino} — ${veiculo.placa}`,
          tipo: 'RECEITA',
          categoriaId: input.categoriaId,
          contaBancariaId: input.contaBancariaId,
          centroCustoId: input.centroCustoId,
          pago: input.pago,
        })
      )
      lancamentoId = lanc.id
    }

    const viagem = await prisma.viagem.create({
      data: {
        veiculo_id: veiculo.id,
        origem: input.origem,
        destino: input.destino,
        data_inicio: input.dataInicio,
        data_fim: input.dataFim ?? null,
        km_rodado: input.kmRodado ?? null,
        valor:
          input.valorReceita != null && input.valorReceita > 0
            ? new Decimal(input.valorReceita)
            : null,
        lancamento_id: lancamentoId,
      },
    })

    return { viagem, lancamentoId }
  }

  static async registrarViagensRecorrentesComReceita(
    organizationId: string,
    input: {
      veiculoId: string
      origem: string
      destino: string
      dataInicio: Date
      dataFim?: Date | null
      kmRodado?: number | null
      valorReceita?: number | null
      categoriaId?: string
      contaBancariaId?: string
      centroCustoId?: string | null
      pago?: boolean
      recorrenciaFim: Date
      diasSemana: number[]
    }
  ) {
    if (input.diasSemana.length === 0) {
      throw new BadRequestError(
        'Selecione ao menos um dia da semana para recorrência.',
      )
    }
    if (input.recorrenciaFim < input.dataInicio) {
      throw new BadRequestError(
        'A data final da recorrência deve ser maior ou igual à data inicial.',
      )
    }

    const ocorrencias = this.buildRecurrenceDates(
      input.dataInicio,
      input.recorrenciaFim,
      input.diasSemana,
    )
    if (ocorrencias.length === 0) {
      throw new BadRequestError(
        'Nenhuma data foi gerada para os dias da semana selecionados.',
      )
    }

    const durationMs =
      input.dataFim && input.dataFim > input.dataInicio
        ? input.dataFim.getTime() - input.dataInicio.getTime()
        : null

    const viagemIds: string[] = []
    const lancamentoIds: string[] = []

    for (const occ of ocorrencias) {
      const dataInicio = new Date(occ)
      dataInicio.setHours(
        input.dataInicio.getHours(),
        input.dataInicio.getMinutes(),
        0,
        0,
      )

      const dataFim =
        durationMs != null ? new Date(dataInicio.getTime() + durationMs) : null

      const result = await this.registrarViagemComReceita(organizationId, {
        veiculoId: input.veiculoId,
        origem: input.origem,
        destino: input.destino,
        dataInicio,
        dataFim,
        kmRodado: input.kmRodado ?? null,
        valorReceita: input.valorReceita ?? null,
        categoriaId: input.categoriaId,
        contaBancariaId: input.contaBancariaId,
        centroCustoId: input.centroCustoId ?? null,
        pago: input.pago,
      })

      viagemIds.push(result.viagem.id)
      if (result.lancamentoId) {
        lancamentoIds.push(result.lancamentoId)
      }
    }

    return {
      viagemIds,
      lancamentoIds,
      totalCriadas: viagemIds.length,
    }
  }

  private static lancamentoPatchAbastecimentoManutencao(
    veiculoId: string,
    input: {
      data: Date
      valor: number
      categoriaId: string
      contaBancariaId: string
      centroCustoId?: string | null
      pago?: boolean
      descricao: string
      tipo: 'DESPESA'
    },
  ) {
    const pago = input.pago ?? false
    return {
      data: input.data.toISOString(),
      valor: input.valor,
      descricao: input.descricao,
      categoria_id: input.categoriaId,
      conta_bancaria_id: input.contaBancariaId,
      centro_custo_id: input.centroCustoId ?? undefined,
      veiculo_id: veiculoId,
      pago,
      tipo: input.tipo,
      status_lancamento: pago ? ('PAGO' as const) : ('PENDENTE' as const),
      valor_pago: pago ? input.valor : 0,
      data_pagamento: pago ? input.data.toISOString() : '',
    }
  }

  static async atualizarAbastecimento(
    organizationId: string,
    veiculoId: string,
    abastecimentoId: string,
    input: {
      data: Date
      litros: number
      valor: number
      km?: number | null
      categoriaId: string
      contaBancariaId: string
      centroCustoId?: string | null
      pago?: boolean
    },
  ) {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')

    const ab = await prisma.abastecimento.findFirst({
      where: { id: abastecimentoId, veiculo_id: veiculoId },
    })
    if (!ab) throw new BadRequestError('Abastecimento não encontrado.')
    if (!ab.lancamento_id) {
      throw new BadRequestError('Abastecimento sem lançamento vinculado.')
    }

    await LancamentoService.update(
      ab.lancamento_id,
      organizationId,
      FrotaService.lancamentoPatchAbastecimentoManutencao(veiculoId, {
        data: input.data,
        valor: input.valor,
        categoriaId: input.categoriaId,
        contaBancariaId: input.contaBancariaId,
        centroCustoId: input.centroCustoId,
        pago: input.pago,
        descricao: `Abastecimento — ${veiculo.placa}`,
        tipo: 'DESPESA',
      }),
    )

    await prisma.abastecimento.update({
      where: { id: abastecimentoId },
      data: {
        data: input.data,
        litros: input.litros,
        valor: new Decimal(input.valor),
        km: input.km ?? null,
      },
    })

    if (input.km != null) {
      await prisma.veiculo.update({
        where: { id: veiculo.id },
        data: { km_atual: input.km },
      })
    }
  }

  static async excluirAbastecimento(
    organizationId: string,
    veiculoId: string,
    abastecimentoId: string,
  ) {
    await prisma.veiculo.findFirstOrThrow({
      where: { id: veiculoId, organization_id: organizationId },
    })
    const ab = await prisma.abastecimento.findFirst({
      where: { id: abastecimentoId, veiculo_id: veiculoId },
    })
    if (!ab) throw new BadRequestError('Abastecimento não encontrado.')
    if (ab.lancamento_id) {
      await LancamentoService.delete(ab.lancamento_id, organizationId)
    } else {
      await prisma.abastecimento.delete({ where: { id: abastecimentoId } })
    }
  }

  static async atualizarManutencao(
    organizationId: string,
    veiculoId: string,
    manutencaoId: string,
    input: {
      tipo: string
      descricao?: string | null
      data: Date
      valor: number
      categoriaId: string
      contaBancariaId: string
      centroCustoId?: string | null
      pago?: boolean
    },
  ) {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')

    const man = await prisma.manutencao.findFirst({
      where: { id: manutencaoId, veiculo_id: veiculoId },
    })
    if (!man) throw new BadRequestError('Manutenção não encontrada.')
    if (!man.lancamento_id) {
      throw new BadRequestError('Manutenção sem lançamento vinculado.')
    }

    await LancamentoService.update(
      man.lancamento_id,
      organizationId,
      FrotaService.lancamentoPatchAbastecimentoManutencao(veiculoId, {
        data: input.data,
        valor: input.valor,
        categoriaId: input.categoriaId,
        contaBancariaId: input.contaBancariaId,
        centroCustoId: input.centroCustoId,
        pago: input.pago,
        descricao: `Manutenção (${input.tipo}) — ${veiculo.placa}`,
        tipo: 'DESPESA',
      }),
    )

    await prisma.manutencao.update({
      where: { id: manutencaoId },
      data: {
        tipo: input.tipo,
        descricao: input.descricao ?? null,
        data: input.data,
        valor: new Decimal(input.valor),
      },
    })
  }

  static async excluirManutencao(
    organizationId: string,
    veiculoId: string,
    manutencaoId: string,
  ) {
    await prisma.veiculo.findFirstOrThrow({
      where: { id: veiculoId, organization_id: organizationId },
    })
    const man = await prisma.manutencao.findFirst({
      where: { id: manutencaoId, veiculo_id: veiculoId },
    })
    if (!man) throw new BadRequestError('Manutenção não encontrada.')
    if (man.lancamento_id) {
      await LancamentoService.delete(man.lancamento_id, organizationId)
    } else {
      await prisma.manutencao.delete({ where: { id: manutencaoId } })
    }
  }

  static async atualizarViagem(
    organizationId: string,
    veiculoId: string,
    viagemId: string,
    input: {
      origem: string
      destino: string
      dataInicio: Date
      dataFim?: Date | null
      kmRodado?: number | null
      valorReceita?: number | null
      categoriaId?: string
      contaBancariaId?: string
      centroCustoId?: string | null
      pago?: boolean
    },
  ) {
    this.validateReceitaLancamentoInput(input)

    const veiculo = await prisma.veiculo.findFirst({
      where: { id: veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')

    const vi = await prisma.viagem.findFirst({
      where: { id: viagemId, veiculo_id: veiculoId },
    })
    if (!vi) throw new BadRequestError('Viagem não encontrada.')
    await this.assertSemConflitoComDisponibilidade(
      organizationId,
      veiculoId,
      input.dataInicio,
      input.dataFim ?? null,
    )

    const hasReceita =
      input.valorReceita != null &&
      input.valorReceita > 0 &&
      !!input.categoriaId &&
      !!input.contaBancariaId

    const baseViagem = {
      origem: input.origem,
      destino: input.destino,
      data_inicio: input.dataInicio,
      data_fim: input.dataFim ?? null,
      km_rodado: input.kmRodado ?? null,
    }

    if (vi.lancamento_id) {
      if (hasReceita) {
        const pago = input.pago ?? false
        await LancamentoService.update(vi.lancamento_id, organizationId, {
          data: input.dataInicio.toISOString(),
          valor: input.valorReceita!,
          descricao: `Receita de viagem ${input.origem} → ${input.destino} — ${veiculo.placa}`,
          tipo: 'RECEITA',
          categoria_id: input.categoriaId,
          conta_bancaria_id: input.contaBancariaId,
          centro_custo_id: input.centroCustoId ?? undefined,
          veiculo_id: veiculoId,
          pago,
          status_lancamento: pago ? 'PAGO' : 'PENDENTE',
          valor_pago: pago ? input.valorReceita! : 0,
          data_pagamento: pago ? input.dataInicio.toISOString() : '',
        })
        await prisma.viagem.update({
          where: { id: viagemId },
          data: {
            ...baseViagem,
            valor: new Decimal(input.valorReceita!),
          },
        })
      } else {
        const lancId = vi.lancamento_id
        await prisma.$transaction(async (tx) => {
          await tx.viagem.update({
            where: { id: viagemId },
            data: {
              ...baseViagem,
              lancamento_id: null,
              valor: null,
            },
          })
          await tx.lancamento.delete({ where: { id: lancId } })
        })
      }
    } else if (hasReceita) {
      const lanc = await LancamentoService.create(
        organizationId,
        FrotaService.buildLancamentoBase(veiculo, {
          data: input.dataInicio,
          valor: input.valorReceita!,
          descricao: `Receita de viagem ${input.origem} → ${input.destino} — ${veiculo.placa}`,
          tipo: 'RECEITA',
          categoriaId: input.categoriaId!,
          contaBancariaId: input.contaBancariaId!,
          centroCustoId: input.centroCustoId,
          pago: input.pago,
        }),
      )
      await prisma.viagem.update({
        where: { id: viagemId },
        data: {
          ...baseViagem,
          lancamento_id: lanc.id,
          valor: new Decimal(input.valorReceita!),
        },
      })
    } else {
      await prisma.viagem.update({
        where: { id: viagemId },
        data: { ...baseViagem },
      })
    }
  }

  static async excluirViagem(
    organizationId: string,
    veiculoId: string,
    viagemId: string,
  ) {
    await prisma.veiculo.findFirstOrThrow({
      where: { id: veiculoId, organization_id: organizationId },
    })
    const vi = await prisma.viagem.findFirst({
      where: { id: viagemId, veiculo_id: veiculoId },
    })
    if (!vi) throw new BadRequestError('Viagem não encontrada.')
    if (vi.lancamento_id) {
      await LancamentoService.delete(vi.lancamento_id, organizationId)
    } else {
      await prisma.viagem.delete({ where: { id: viagemId } })
    }
  }

  static async listarDisponibilidades(
    organizationId: string,
    veiculoId: string,
    filters?: { inicio?: Date | null; fim?: Date | null },
  ) {
    await prisma.veiculo.findFirstOrThrow({
      where: { id: veiculoId, organization_id: organizationId },
    })
    const inicioFiltro = filters?.inicio ?? null
    const fimFiltro = filters?.fim ?? null

    return prisma.veiculoDisponibilidade.findMany({
      where: {
        organization_id: organizationId,
        veiculo_id: veiculoId,
        ...(inicioFiltro && { fim: { gte: inicioFiltro } }),
        ...(fimFiltro && { inicio: { lte: fimFiltro } }),
      },
      orderBy: { inicio: 'asc' },
    })
  }

  static async criarDisponibilidade(
    organizationId: string,
    input: {
      veiculoId: string
      tipo: 'PRODUCAO' | 'MANUTENCAO'
      inicio: Date
      fim: Date
      motivo?: string | null
      origem?: 'MANUAL' | 'AUTOMATICA'
    },
  ) {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: input.veiculoId, organization_id: organizationId },
    })
    if (!veiculo) throw new BadRequestError('Veículo não encontrado.')

    const { start, end } = this.normalizeInterval(input.inicio, input.fim)
    await this.assertSemConflitoEntreDisponibilidades(
      organizationId,
      veiculo.id,
      start,
      end,
    )
    await this.assertSemConflitoComViagem(organizationId, veiculo.id, start, end)

    return prisma.veiculoDisponibilidade.create({
      data: {
        organization_id: organizationId,
        veiculo_id: veiculo.id,
        tipo: input.tipo,
        inicio: start,
        fim: end,
        motivo: input.motivo ?? null,
        origem: input.origem ?? 'MANUAL',
      },
    })
  }

  static async atualizarDisponibilidade(
    organizationId: string,
    veiculoId: string,
    disponibilidadeId: string,
    input: {
      tipo: 'PRODUCAO' | 'MANUTENCAO'
      inicio: Date
      fim: Date
      motivo?: string | null
    },
  ) {
    await prisma.veiculo.findFirstOrThrow({
      where: { id: veiculoId, organization_id: organizationId },
    })
    const atual = await prisma.veiculoDisponibilidade.findFirst({
      where: {
        id: disponibilidadeId,
        veiculo_id: veiculoId,
        organization_id: organizationId,
      },
    })
    if (!atual) throw new BadRequestError('Disponibilidade não encontrada.')

    const { start, end } = this.normalizeInterval(input.inicio, input.fim)
    await this.assertSemConflitoEntreDisponibilidades(
      organizationId,
      veiculoId,
      start,
      end,
      disponibilidadeId,
    )
    await this.assertSemConflitoComViagem(
      organizationId,
      veiculoId,
      start,
      end,
    )

    return prisma.veiculoDisponibilidade.update({
      where: { id: disponibilidadeId },
      data: {
        tipo: input.tipo,
        inicio: start,
        fim: end,
        motivo: input.motivo ?? null,
      },
    })
  }

  static async excluirDisponibilidade(
    organizationId: string,
    veiculoId: string,
    disponibilidadeId: string,
  ) {
    const item = await prisma.veiculoDisponibilidade.findFirst({
      where: {
        id: disponibilidadeId,
        veiculo_id: veiculoId,
        organization_id: organizationId,
      },
    })
    if (!item) throw new BadRequestError('Disponibilidade não encontrada.')
    await prisma.veiculoDisponibilidade.delete({ where: { id: item.id } })
  }
}
