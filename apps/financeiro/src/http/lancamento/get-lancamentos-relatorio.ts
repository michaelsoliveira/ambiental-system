import { api } from "../api-client"

interface LancamentoRelatorio {
  id: string
  numero: string
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  data: string
  data_vencimento: string | null
  descricao: string
  valor: number
  valor_pago: number | null
  pago: boolean
  data_pagamento: string | null
  categoria?: {
    id: string
    nome: string
    tipo: string
  }
  conta_bancaria?: {
    id: string
    nome: string
  }
  centro_custo?: {
    id: string
    nome: string
  } | null
  parceiro_nome?: string | null
}

interface GetLancamentosRelatorioResponse {
  lancamentos: LancamentoRelatorio[]
  saldo_anterior: number
  saldo_final: number
}

export async function getLancamentosRelatorio(
  org: string,
  params?: {
    data_inicio?: string
    data_fim?: string
    conta_bancaria_id?: string
    categoria_id?: string
    centro_custo_id?: string
    parceiro_id?: string
    tipo?: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    pago?: boolean
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.data_inicio) searchParams.append('data_inicio', params.data_inicio)
  if (params?.data_fim) searchParams.append('data_fim', params.data_fim)
  if (params?.conta_bancaria_id) searchParams.append('conta_bancaria_id', params.conta_bancaria_id)
  if (params?.categoria_id) searchParams.append('categoria_id', params.categoria_id)
  if (params?.centro_custo_id) searchParams.append('centro_custo_id', params.centro_custo_id)
  if (params?.parceiro_id) searchParams.append('parceiro_id', params.parceiro_id)
  if (params?.tipo) searchParams.append('tipo', params.tipo)
  if (params?.pago !== undefined) searchParams.append('pago', String(params.pago))
  
  // Não enviar campos vazios ou "all-*" para evitar erros de validação

  const url = `organizations/${org}/financeiro/lancamentos/relatorio${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  const result = await api
    .get(url)
    .json<GetLancamentosRelatorioResponse>()

  return result
}
