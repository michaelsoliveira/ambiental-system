import { api } from "../api-client"

interface UpdateContaData {
  codigo?: string
  nome?: string
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

export async function updateConta(org: string, id: string, data: UpdateContaData) {
  const result = await api
    .put(`organizations/${org}/financeiro/contas/${id}`, { json: data })
    .json<{ contaBancariaId: string }>()

  return result
}
