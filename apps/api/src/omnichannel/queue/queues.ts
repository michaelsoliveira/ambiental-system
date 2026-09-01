import { Queue } from 'bullmq'
import { getBullConnection, isOmnichannelQueueEnabled } from './connection'

export const OC_QUEUES = {
  agent: 'oc-agent',
  outbound: 'oc-outbound',
  automation: 'oc-automation',
  watchdog: 'oc-watchdog',
} as const

export type OcQueueName = (typeof OC_QUEUES)[keyof typeof OC_QUEUES]

export type RunAgentJobData = {
  conversaId: string
  organizationId: string
  context?: string
}

export type OutboundSendJobData = {
  organizationId: string
  conversaId: string
  mensagemId: string
  texto: string
  /** Canal de entrega */
  channel: 'whatsapp' | 'email'
  /** WhatsApp */
  phone?: string
  instanceName?: string
  instanceToken?: string | null
  /** E-mail */
  email?: string
  subject?: string
}

export type RunAutomationJobData = {
  organizationId: string
  automacaoId: string
  conversaId?: string
  contexto?: Record<string, unknown>
}

export type WatchdogJobData = {
  kind: 'timer' | 'cron'
}

const queues = new Map<string, Queue>()

function getQueue(name: string): Queue | null {
  if (!isOmnichannelQueueEnabled()) return null
  let q = queues.get(name)
  if (!q) {
    q = new Queue(name, {
      connection: getBullConnection(),
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    })
    queues.set(name, q)
  }
  return q
}

export function getAgentQueue() {
  return getQueue(OC_QUEUES.agent)
}

export function getOutboundQueue() {
  return getQueue(OC_QUEUES.outbound)
}

export function getAutomationQueue() {
  return getQueue(OC_QUEUES.automation)
}

export function getWatchdogQueue() {
  return getQueue(OC_QUEUES.watchdog)
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()))
  queues.clear()
}
