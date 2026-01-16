import { api } from "../api-client"

interface CreateContaData {
  codigo: string
  nome: string
  tipo_conta?: 'BANCARIA' | 'CONTABIL'
  banco?: string
  agencia?: string
  numero?: string
  digito?: string
  tipoConta?: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CREDITO'
  saldoInicial?: number
  limiteCredito?: number
  dataAbertura?: string
  conta_pai_id?: string
  ativo?: boolean
  observacoes?: string
}

export async function createConta(org: string, data: CreateContaData) {
  const result = await api
    .post(`organizations/${org}/financeiro/contas`, { json: data })
    .json<{ contaBancariaId: string }>()

  return result
}
