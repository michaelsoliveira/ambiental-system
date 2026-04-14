import { useQuery } from '@tanstack/react-query'

import { getParceiros } from '@/http/parceiro/get-parceiros'

export function useParceiros(
  org: string,
  params?: {
    ativo?: boolean
    tipo_parceiro?: 'CLIENTE' | 'FORNECEDOR' | 'AMBOS'
    search?: string
    page?: number
    limit?: number
    orderBy?: 'created_at' | 'tipo_parceiro'
    order?: 'asc' | 'desc'
  },
) {
  return useQuery({
    queryKey: ['parceiros', org, params],
    queryFn: () => getParceiros(org, params),
    enabled: !!org,
  })
}
