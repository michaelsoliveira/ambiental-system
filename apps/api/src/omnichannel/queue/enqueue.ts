import {
  getAgentQueue,
  getAutomationQueue,
  getOutboundQueue,
  type OutboundSendJobData,
  type RunAgentJobData,
  type RunAutomationJobData,
} from './queues'

/**
 * Enfileira run-agent. Se Redis indisponível, executa em background (fallback SST).
 */
export async function enqueueRunAgent(
  data: RunAgentJobData,
): Promise<void> {
  const queue = getAgentQueue()
  if (queue) {
    await queue.add('run-agent', data, {
      jobId: `agent-${data.conversaId}-${Date.now()}`,
    })
    return
  }

  console.warn(
    '[oc-queue] REDIS_URL ausente — run-agent em fallback local',
  )
  void import('../jobs/run-agent.job').then(({ processRunAgent }) =>
    processRunAgent(data).catch((err) =>
      console.error('[oc-queue] fallback run-agent falhou:', err),
    ),
  )
}

export async function enqueueOutboundSend(
  data: OutboundSendJobData,
): Promise<void> {
  const queue = getOutboundQueue()
  if (queue) {
    await queue.add('outbound-send', data, {
      jobId: `out-${data.mensagemId}`,
    })
    return
  }

  console.warn(
    '[oc-queue] REDIS_URL ausente — outbound-send em fallback local',
  )
  void import('../jobs/outbound-send.job').then(({ processOutboundSend }) =>
    processOutboundSend(data).catch((err) =>
      console.error('[oc-queue] fallback outbound falhou:', err),
    ),
  )
}

export async function enqueueRunAutomation(
  data: RunAutomationJobData,
): Promise<void> {
  const queue = getAutomationQueue()
  if (queue) {
    await queue.add('run-automation', data)
    return
  }

  console.warn(
    '[oc-queue] REDIS_URL ausente — automação em fallback local',
  )
  void import('../jobs/watchdog.job').then(({ processAutomation }) =>
    processAutomation(data).catch((err) =>
      console.error('[oc-queue] fallback automation falhou:', err),
    ),
  )
}
