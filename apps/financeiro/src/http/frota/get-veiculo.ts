import { api } from '../api-client'

export type LancamentoFrotaRef = {
  id: string
  numero: string
  valor: unknown
  categoria_id: string
  conta_bancaria_id: string
  centro_custo_id: string | null
  pago: boolean
} | null

export type VeiculoDetalhe = {
  id: string
  placa: string
  modelo: string
  marca: string
  ano?: number | null
  tipo: string | null
  km_atual: number | null
  ativo: boolean
  abastecimentos: Array<{
    id: string
    data: string
    litros: number
    valor: unknown
    km: number | null
    lancamento: LancamentoFrotaRef
  }>
  manutencoes: Array<{
    id: string
    tipo: string
    descricao: string | null
    data: string
    valor: unknown
    lancamento: LancamentoFrotaRef
  }>
  viagens: Array<{
    id: string
    origem: string
    destino: string
    data_inicio: string
    data_fim: string | null
    km_rodado: number | null
    valor: unknown
    lancamento: LancamentoFrotaRef
  }>
}

export async function getVeiculo(org: string, veiculoId: string) {
  return api
    .get(`organizations/${org}/financeiro/frota/veiculos/${veiculoId}`)
    .json<VeiculoDetalhe>()
}
