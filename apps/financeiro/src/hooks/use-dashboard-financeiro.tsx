import { useQuery } from '@tanstack/react-query'

import {
  type DashboardRelatorioParams,
  getDashboardResumo,
  getDashboardSeries,
} from '@/http/dashboard/get-dashboard-data'

export function useDashboardResumo(org: string, params?: DashboardRelatorioParams) {
  return useQuery({
    queryKey: ['dashboard-financeiro-resumo', org, params],
    enabled: !!org,
    queryFn: async () => getDashboardResumo(org, params),
  })
}

export function useDashboardSeries(
  org: string,
  opts?: { months?: number; competencia?: string; folha_status?: string },
) {
  return useQuery({
    queryKey: ['dashboard-financeiro-series', org, opts],
    enabled: !!org,
    queryFn: async () => getDashboardSeries(org, opts),
  })
}
