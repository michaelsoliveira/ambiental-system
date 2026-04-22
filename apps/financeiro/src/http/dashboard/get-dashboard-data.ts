import { api } from '../api-client'

export type DashboardRelatorioParams = {
  competencia?: string
  folha_status?: string
}

export async function getDashboardResumo(org: string, params?: DashboardRelatorioParams) {
  return api
    .get(`organizations/${org}/financeiro/dashboard/resumo`, {
      searchParams: {
        ...(params?.competencia ? { competencia: params.competencia } : {}),
        folha_status: params?.folha_status ?? 'TODAS',
      },
    })
    .json<any>()
}

export async function getDashboardSeries(
  org: string,
  opts?: { months?: number; competencia?: string; folha_status?: string },
) {
  const months = opts?.months ?? 12
  return api
    .get(`organizations/${org}/financeiro/dashboard/series`, {
      searchParams: {
        months,
        ...(opts?.competencia ? { competencia: opts.competencia } : {}),
        folha_status: opts?.folha_status ?? 'TODAS',
      },
    })
    .json<any>()
}
