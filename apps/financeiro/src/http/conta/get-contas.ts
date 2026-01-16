import { api } from "../api-client"

interface GetContasResponse {
  contas: Array<{
    id: string
    codigo: string
    nome: string
    tipo_conta: 'BANCARIA' | 'CONTABIL'
    banco: string | null
    agencia: string | null
    numero: string | null
    digito: string | null
    tipoConta: string | null
    saldoInicial: number
    saldoAtual: number
    limiteCredito: number | null
    dataAbertura: string | null
    conta_pai_id: string | null
    ativo: boolean
    observacoes: string | null
    created_at: string
    updated_at: string
  }>
  total: number
}

export async function getContas(
  org: string,
  params?: {
    ativo?: boolean
    tipo?: 'BANCARIA' | 'CONTABIL'
    search?: string
    page?: number
    limit?: number
    orderBy?: string
    order?: 'asc' | 'desc'
  }
) {
  const searchParams = new URLSearchParams()
  if (params?.ativo !== undefined) searchParams.append('ativo', String(params.ativo))
  if (params?.tipo) searchParams.append('tipo', params.tipo)
  if (params?.search) searchParams.append('search', params.search)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.orderBy) searchParams.append('orderBy', params.orderBy)
  if (params?.order) searchParams.append('order', params.order)

  const url = `organizations/${org}/financeiro/contas${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  const result = await api
    .get(url)
    .json<GetContasResponse>()

  return result
}
