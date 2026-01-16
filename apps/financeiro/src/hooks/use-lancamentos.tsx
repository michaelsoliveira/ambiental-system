import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/context/AuthContext'
import { toast } from 'sonner'
import { api } from '@/http/api-client'
import { queryClient } from '@/lib/react-query'
import { Pessoa, lancamentoSchema } from '@saas/auth'

interface GetContasResponse {
  contas: {
    id: string
    codigo: string
    nome: string
    banco: string
    saldoAtual: number
    tipoConta: string
    ativo: boolean
  }[],
  total: number;  
}

interface CreateLancamentoParams {
  formData: FormData
}

interface UpdateLancamentoParams {
  lancamentoId: string
  formData: FormData
}

export interface GetLacamentosResponse {
  lancamentos: Lancamento[]
  pagination: Pagination
}

export interface Lancamento {
  id: string
  numero: string
  tipo: string
  organization_id: string
  categoria_id: string
  centro_custo_id: string
  conta_bancaria: string
  data: string
  data_vencimento: any
  descricao: string
  valor: number
  pago: boolean
  status_lancamento: string
  created_at: string
}

export interface Pagination {
  total: number
  pages: number
  current_page: number
}

export const createLancamentoRequestSchema = z.object({
  numero: z.string().optional(),
  tipo: z.string(),
  data: z.string(),
  organization_id: z.string(),
  categoria_id: z.string(),
  centro_custo_id: z.string(),
  conta_bancaria: z.string(),
  data_vencimento: z
    .string()
    .optional()
    .nullable(),
  descricao: z.string().optional(),
  valor: z.number(),
  pago: z.boolean(),
  status_lancamento: z.string()
})

export type CreateLancamentoRequest = z.infer<typeof createLancamentoRequestSchema>;

export interface Parceiro {
  id: string
  tipo_parceiro: string
  pessoa_id: string
  observacoes?: string
  ativo: boolean
  created_at: string
  pessoa: Pessoa
}

export type GetParceiroResponse = Omit<Parceiro, 'id | created_at'>
export type GetParceirosResponse = { 
  parceiros: Array<GetParceiroResponse>,
  total: number
}

export function useLancamentos(org: string, params: Record<string, any>) {
  return useQuery({
    queryKey: ['lancamentos', org, params],
    queryFn: async () => {
      const result = await api
        .get(`organizations/${org}/financeiro/lancamentos`, { searchParams: params })
        .json<GetLacamentosResponse>()

      return result
    },
  })
}

export function useLancamento(org: string, lancamentoId: string, enabled: boolean = true) {

  return useQuery({
    queryKey: ['lancamento', lancamentoId],
    queryFn: async () => {
      const result = await api.get(`organizations/${org}/lancamento/${lancamentoId}`).json<any>()
      return result
    },
    enabled: !!lancamentoId && enabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateLancamento(org: string) {
  return useMutation({
    mutationFn: async ({ formData }: CreateLancamentoParams) => {
      // const request = createLancamentoRequestSchema.safeParse(Object.fromEntries(formData))
      if (!(formData instanceof FormData)) {
        throw new Error('formData precisa ser uma instância de FormData')
      }

      const response = await api.post(`organizations/${org}/financeiro/lancamentos`, {
        body: formData
      }).json()
      return response
    },
    onSuccess: (data) => {
      toast.success('Lançamento criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] })
    },
    onError: (error: any) => {
      console.log(error)
      const message = error.message || 'Erro ao criar lançamento'
      toast.error(message)
    }
  })
}

export function useUpdateLancamento(org: string) {
  return useMutation({
    mutationFn: async ({ lancamentoId, formData }: UpdateLancamentoParams) => {
      const result = await api.put(`organizations/${org}/financeiro/lancamentos/${lancamentoId}`, {
        body: formData
      }).json()
      return result
    },
    onSuccess: (data) => {
      toast.success('Lançamento atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar lançamento'
      toast.error(message)
    }
  })
}

export function useDeleteLancamento(org: string) {
  return useMutation({
    mutationFn: async (lancamentoId: string) => {
      const result = await api.delete(`organizations/${org}/lancamento/${lancamentoId}`)
      return result
    },
    onSuccess: () => {
      toast.success('Lançamento deletado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao deletar lançamento'
      toast.error(message)
    }
  })
}

export function useDuplicateLancamento(org: string) {
  return useMutation({
    mutationFn: async (lancamentoId: string) => {
      const result = await api.post(`organizations/${org}/lancamento/${lancamentoId}/duplicate`).json()
      return result
    },
    onSuccess: () => {
      toast.success('Lançamento duplicado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao duplicar lançamento'
      toast.error(message)
    }
  })
}

export function useGetCategorias(org: string) {
  return useQuery({
    queryKey: ['categorias-financeiras'],
    queryFn: async () => {
      const result = await api.get(`organizations/${org}/financeiro/categorias`).json<any>()
      return result
    },
  })
}

export function useGetContas(org: string) {
  return useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: async () => {
      const result = await api
        .get(`organizations/${org}/financeiro/contas`)
        .json<GetContasResponse>()
      return result
    },
  })
}

export function useGetCentrosCusto(org: string) {
  return useQuery({
    queryKey: ['centros-custo'],
    queryFn: async () => {
      const result = await api.get(`organizations/${org}/financeiro/centros-custo`).json<any>()
      return result
    },
  })
}

export function useGetParceiros(org: string) {
  return useQuery({
    queryKey: ['parceiros'],
    queryFn: async () => {
      const result = await api
          .get(`organizations/${org}/financeiro/parceiros`)
          .json<GetParceirosResponse>()

      return result
    },
  })
}