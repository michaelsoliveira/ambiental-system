import { api } from '../api-client'

export async function getDashboardResumo(org: string) {
  return api.get(`organizations/${org}/financeiro/dashboard/resumo`).json<any>()
}

export async function getDashboardSeries(org: string, months = 12, competencia?: string) {
  return api
    .get(`organizations/${org}/financeiro/dashboard/series`, {
      searchParams: { months, competencia },
    })
    .json<any>()
}
