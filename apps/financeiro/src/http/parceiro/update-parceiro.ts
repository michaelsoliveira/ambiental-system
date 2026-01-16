import { api } from "../api-client"

interface UpdateParceiroRequest {
    org: string
    parceiroId: string
    codigo?: string
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