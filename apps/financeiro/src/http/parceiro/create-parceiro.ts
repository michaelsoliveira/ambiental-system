import { api } from "../api-client"

interface CreateParceiroRequest {
  org: string
  tipo_parceiro?: string
  pessoa_id: string
  observacoes?: string | null
  ativo: boolean
}

export async function createParceiro({
  org,
  tipo_parceiro,
  pessoa_id,
  observacoes,
  ativo,
}: CreateParceiroRequest) {
  await api
    .post(`organizations/${org}/financeiro/parceiros`, {
      json: {
        tipo_parceiro,
        pessoa_id,
        observacoes,
        ativo,
      },
    })
    .json()
}