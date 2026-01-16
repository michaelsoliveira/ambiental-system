import { api } from "../api-client"

interface GetParceiroResponse {
    parceiro: {
      id: string
      codigo: string
      observacoes: string | null
      ativo: boolean
      created_at: string
      updated_at: string
      pessoa: {
        id: string
        email: string | null
        telefone: string | null
        tipo: 'F' | 'J'
        fisica?: {
          nome: string
          cpf: string | null
          rg: string | null
          data_nascimento: string | null
        } | null
        juridica?: {
          nome_fantasia: string
          cnpj: string | null
          razao_social: string | null
          inscricao_estadual: string | null
          inscricao_municipal: string | null
        } | null
        endereco?: {
          logradouro: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cep: string | null
          municipio?: {
            nome: string
            estado: {
              nome: string
              uf: string
            }
          } | null
        } | null
      }
      lancamentos: Array<{
        id: string
        numero: string
        tipo: string
        valor: number
        data: string
        status_lancamento: string
      }>
    }
  }
  
  export async function getParceiro(org: string, parceiroId: string) {
    const result = await api
      .get(`organizations/${org}/financeiro/parceiros/${parceiroId}`)
      .json<GetParceiroResponse>()
  
    return result
  }