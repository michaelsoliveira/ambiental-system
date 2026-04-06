import { api } from '../api-client'

export type TipoParceiro = 'CLIENTE' | 'FORNECEDOR' | 'AMBOS'

export interface UpdateParceiroRequest {
  org: string
  parceiroId: string
  tipo_parceiro?: TipoParceiro
  pessoa_id?: string
  observacoes?: string | null
  ativo?: boolean
}

export async function updateParceiro({
  org,
  parceiroId,
  ...data
}: UpdateParceiroRequest) {
  await api
    .put(`organizations/${org}/financeiro/parceiros/${parceiroId}`, {
      json: data,
    })
    .json()
}
