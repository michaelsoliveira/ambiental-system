import { api } from '../api-client'

export type ContaDetail = {
  id: string
  codigo: string
  nome: string
  tipo_conta: 'BANCARIA' | 'CONTABIL'
  banco: string | null
  ativo: boolean
}

export async function getConta(org: string, contaId: string) {
  return api
    .get(`organizations/${org}/financeiro/contas/${contaId}`)
    .json<{ conta: ContaDetail }>()
}
