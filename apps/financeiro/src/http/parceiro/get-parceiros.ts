import { api } from "../api-client"

interface GetParceirosResponse {
    parceiros: Array<{
      id: string
      tipo_parceiro: string
      observacoes: string | null
      ativo: boolean
      created_at: string
      updated_at: string
      pessoa: {
        id: string
        email: string | null
        telefone: string | null
        tipo: string
        fisica?: {
          nome: string
          cpf: string | null
        } | null
        juridica?: {
          nome_fantasia: string
          cnpj: string | null
          razao_social: string | null
        } | null
      }
    }>
  }
  
  export async function getParceiros(org: string) {
    const result = await api
      .get(`organizations/${org}/financeiro/parceiros`)
      .json<GetParceirosResponse>()
  
    return result
  }