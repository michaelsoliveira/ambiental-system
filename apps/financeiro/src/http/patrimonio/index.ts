import { api } from "../api-client"

export type CategoriaPatrimonio =
  | 'IMOVEL'
  | 'VEICULO'
  | 'MAQUINA_EQUIPAMENTO'
  | 'MOVEL_UTENSILIO'
  | 'INFORMATICA'
  | 'INVESTIMENTO'
  | 'ESTOQUE'
  | 'OUTRO'

export type StatusPatrimonioAtivo = 'ATIVO' | 'BAIXADO' | 'VENDIDO' | 'MANUTENCAO' | 'INATIVO'
export type MetodoDepreciacaoPatrimonio = 'LINEAR' | 'ACELERADA' | 'MANUAL' | 'NAO_DEPRECIA'
export type TipoPatrimonioPassivo =
  | 'EMPRESTIMO'
  | 'FINANCIAMENTO'
  | 'PARCELAMENTO'
  | 'FORNECEDOR'
  | 'TRIBUTO'
  | 'TRABALHISTA'
  | 'OUTRO'
export type StatusPatrimonioPassivo = 'ABERTO' | 'QUITADO' | 'CANCELADO' | 'ATRASADO'

export type PatrimonioAtivo = {
  id: string
  nome: string
  descricao?: string | null
  categoria: CategoriaPatrimonio
  tipo?: string | null
  codigo?: string | null
  data_aquisicao?: string | null
  valor_aquisicao: number
  valor_atual: number
  metodo_depreciacao?: MetodoDepreciacaoPatrimonio | null
  taxa_depreciacao_anual?: number | null
  vida_util_meses?: number | null
  status: StatusPatrimonioAtivo
  localizacao?: string | null
  responsavel?: string | null
  observacoes?: string | null
  avaliacoes?: Array<{ id: string; data_avaliacao: string; valor: number; avaliador?: string | null }>
}

export type PatrimonioPassivo = {
  id: string
  descricao: string
  tipo: TipoPatrimonioPassivo
  credor?: string | null
  valor_original: number
  saldo_devedor: number
  data_inicio?: string | null
  data_vencimento?: string | null
  taxa_juros?: number | null
  status: StatusPatrimonioPassivo
  observacoes?: string | null
}

export type PatrimonioResumo = {
  totalAtivos: number
  dividasAutomaticas: number
  totalPassivosManuais: number
  totalDividas: number
  patrimonioLiquido: number
  relacaoDividaPatrimonio: number | null
  origensDivida: Array<{ origem: string; valor: number }>
}

type ListParams = {
  search?: string
  categoria?: string
  tipo?: string
  status?: string
  page?: number
  limit?: number
}

function buildSearchParams(params?: ListParams) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.append('search', params.search)
  if (params?.categoria) searchParams.append('categoria', params.categoria)
  if (params?.tipo) searchParams.append('tipo', params.tipo)
  if (params?.status) searchParams.append('status', params.status)
  if (params?.page) searchParams.append('page', String(params.page))
  if (params?.limit) searchParams.append('limit', String(params.limit))

  return searchParams.toString()
}

export async function getPatrimonioResumo(org: string) {
  return api
    .get(`organizations/${org}/financeiro/patrimonios/resumo`)
    .json<PatrimonioResumo>()
}

export async function getPatrimonioAtivos(org: string, params?: ListParams) {
  const query = buildSearchParams(params)

  return api
    .get(`organizations/${org}/financeiro/patrimonios/ativos${query ? `?${query}` : ''}`)
    .json<{ ativos: PatrimonioAtivo[]; total: number }>()
}

export async function createPatrimonioAtivo(org: string, data: any) {
  return api
    .post(`organizations/${org}/financeiro/patrimonios/ativos`, { json: data })
    .json<{ patrimonioAtivoId: string }>()
}

export async function updatePatrimonioAtivo(org: string, id: string, data: any) {
  return api.put(`organizations/${org}/financeiro/patrimonios/ativos/${id}`, { json: data })
}

export async function deletePatrimonioAtivo(org: string, id: string) {
  return api.delete(`organizations/${org}/financeiro/patrimonios/ativos/${id}`)
}

export async function createPatrimonioAvaliacao(org: string, ativoId: string, data: any) {
  return api
    .post(`organizations/${org}/financeiro/patrimonios/ativos/${ativoId}/avaliacoes`, { json: data })
    .json<{ patrimonioAvaliacaoId: string }>()
}

export async function getPatrimonioPassivos(org: string, params?: ListParams) {
  const query = buildSearchParams(params)

  return api
    .get(`organizations/${org}/financeiro/patrimonios/passivos${query ? `?${query}` : ''}`)
    .json<{ passivos: PatrimonioPassivo[]; total: number }>()
}

export async function createPatrimonioPassivo(org: string, data: any) {
  return api
    .post(`organizations/${org}/financeiro/patrimonios/passivos`, { json: data })
    .json<{ patrimonioPassivoId: string }>()
}

export async function updatePatrimonioPassivo(org: string, id: string, data: any) {
  return api.put(`organizations/${org}/financeiro/patrimonios/passivos/${id}`, { json: data })
}

export async function deletePatrimonioPassivo(org: string, id: string) {
  return api.delete(`organizations/${org}/financeiro/patrimonios/passivos/${id}`)
}
