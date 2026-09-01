import { api } from '@/http/api-client'
import type { OcPipelineStage } from '../types'

function ocBase(org: string) {
  return `organizations/${org}/omnichannel`
}

export async function fetchOcStages(
  org: string,
  pipelineId: string,
): Promise<OcPipelineStage[]> {
  return api
    .get(`${ocBase(org)}/pipelines/${pipelineId}/stages`)
    .json<OcPipelineStage[]>()
}
