/**
 * oc-worker — consome filas BullMQ do omnichannel
 * (equivalente ao celery worker do inexahub-sst).
 *
 * Uso:
 *   pnpm --filter @saas/api oc:worker
 *   node dist/oc-worker.js
 */
import 'dotenv/config'
import { Worker } from 'bullmq'
import {
  getBullConnection,
  disconnectBullConnection,
  getRedisUrl,
} from './queue/connection'
import { OC_QUEUES, closeAllQueues } from './queue/queues'
import { processRunAgent } from './jobs/run-agent.job'
import { processOutboundSend } from './jobs/outbound-send.job'
import { processAutomation, processWatchdog } from './jobs/watchdog.job'
import type {
  OutboundSendJobData,
  RunAgentJobData,
  RunAutomationJobData,
  WatchdogJobData,
} from './queue/queues'

async function waitForRedis(maxAttempts = 30): Promise<void> {
  const url = getRedisUrl()
  if (!url) {
    throw new Error('REDIS_URL é obrigatório para oc-worker')
  }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const redis = getBullConnection()
      await redis.ping()
      console.info(`oc-worker: Redis OK (tentativa ${attempt})`)
      return
    } catch (err) {
      console.warn(
        `oc-worker: Redis indisponível — tentativa ${attempt}/${maxAttempts}`,
        err instanceof Error ? err.message : err,
      )
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  throw new Error('oc-worker: Redis não respondeu a tempo')
}

async function main() {
  await waitForRedis()
  const connection = getBullConnection()
  const concurrency = Number(process.env.OC_WORKER_CONCURRENCY || 2)

  const workers = [
    new Worker<RunAgentJobData>(
      OC_QUEUES.agent,
      async (job) => processRunAgent(job.data),
      { connection, concurrency },
    ),
    new Worker<OutboundSendJobData>(
      OC_QUEUES.outbound,
      async (job) => processOutboundSend(job.data),
      { connection, concurrency },
    ),
    new Worker<RunAutomationJobData>(
      OC_QUEUES.automation,
      async (job) => processAutomation(job.data),
      { connection, concurrency: 1 },
    ),
    new Worker<WatchdogJobData>(
      OC_QUEUES.watchdog,
      async (job) => processWatchdog(job.data),
      { connection, concurrency: 1 },
    ),
  ]

  for (const w of workers) {
    w.on('failed', (job, err) => {
      console.error(
        `[oc-worker] job falhou queue=${w.name} id=${job?.id}`,
        err.message,
      )
    })
    w.on('completed', (job) => {
      console.info(`[oc-worker] ok queue=${w.name} id=${job.id}`)
    })
  }

  console.info(
    `oc-worker iniciado — filas=${Object.values(OC_QUEUES).join(',')} concurrency=${concurrency}`,
  )

  const shutdown = async () => {
    console.info('oc-worker: encerrando…')
    await Promise.all(workers.map((w) => w.close()))
    await closeAllQueues()
    await disconnectBullConnection()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())
}

main().catch((err) => {
  console.error('oc-worker fatal:', err)
  process.exit(1)
})
