/**
 * oc-beat — agenda jobs periódicos do omnichannel
 * (equivalente ao celery beat do inexahub-sst).
 *
 * Uso:
 *   pnpm --filter @saas/api oc:beat
 *   node dist/oc-beat.js
 */
import 'dotenv/config'
import { Queue } from 'bullmq'
import {
  getBullConnection,
  disconnectBullConnection,
  getRedisUrl,
} from './queue/connection'
import { OC_QUEUES, closeAllQueues } from './queue/queues'
import type { WatchdogJobData } from './queue/queues'

async function waitForRedis(maxAttempts = 30): Promise<void> {
  const url = getRedisUrl()
  if (!url) {
    throw new Error('REDIS_URL é obrigatório para oc-beat')
  }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const redis = getBullConnection()
      await redis.ping()
      console.info(`oc-beat: Redis OK (tentativa ${attempt})`)
      return
    } catch (err) {
      console.warn(
        `oc-beat: Redis indisponível — tentativa ${attempt}/${maxAttempts}`,
        err instanceof Error ? err.message : err,
      )
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  throw new Error('oc-beat: Redis não respondeu a tempo')
}

async function main() {
  await waitForRedis()
  const connection = getBullConnection()
  const queue = new Queue(OC_QUEUES.watchdog, { connection })

  // Timer a cada 15s (SST: watchdog_timer_tick) — BullMQ v6 Job Scheduler
  await queue.upsertJobScheduler(
    'oc-watchdog-timer',
    { every: 15_000 },
    {
      name: 'timer',
      data: { kind: 'timer' } satisfies WatchdogJobData,
      opts: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    },
  )

  // Cron a cada 15 min (SST: watchdog_cron_task)
  await queue.upsertJobScheduler(
    'oc-watchdog-cron',
    { pattern: '*/15 * * * *' },
    {
      name: 'cron',
      data: { kind: 'cron' } satisfies WatchdogJobData,
      opts: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    },
  )

  console.info(
    'oc-beat agendado: watchdog timer=15s, cron=*/15min — mantendo processo vivo',
  )

  const shutdown = async () => {
    console.info('oc-beat: encerrando…')
    await queue.close()
    await closeAllQueues()
    await disconnectBullConnection()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown())
  process.on('SIGTERM', () => void shutdown())

  // Mantém o processo vivo (schedulers vivem no Redis; o beat só registra)
  setInterval(() => {
    /* heartbeat */
  }, 60_000)
}

main().catch((err) => {
  console.error('oc-beat fatal:', err)
  process.exit(1)
})
