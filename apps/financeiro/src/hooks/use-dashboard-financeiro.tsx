import { useQuery } from '@tanstack/react-query'

import { api } from '@/http/api-client'

export function useDashboardResumo(org: string) {
  return useQuery({
    queryKey: ['dashboard-financeiro-resumo', org],
    enabled: !!org,
    queryFn: async () =>
      api.get(`organizations/${org}/financeiro/dashboard/resumo`).json<any>(),
  })
}

export function useDashboardSeries(org: string, months = 12, competencia?: string) {
  return useQuery({
    queryKey: ['dashboard-financeiro-series', org, months, competencia],
    enabled: !!org,
    queryFn: async () =>
      api
        .get(`organizations/${org}/financeiro/dashboard/series`, {
          searchParams: { months, competencia },
        })
        .json<any>(),
  })
}
