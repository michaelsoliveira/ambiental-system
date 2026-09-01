import { Redis } from 'ioredis'

let shared: Redis | null = null

export function getRedisUrl(): string | null {
  const url = process.env.REDIS_URL?.trim()
  return url || null
}

export function isOmnichannelQueueEnabled(): boolean {
  return Boolean(getRedisUrl())
}

/** Conexão compartilhada para BullMQ (maxRetriesPerRequest: null é exigido). */
export function getBullConnection(): Redis {
  const url = getRedisUrl()
  if (!url) {
    throw new Error(
      'REDIS_URL não configurada. Defina no .env para oc-worker / oc-beat.',
    )
  }
  if (!shared) {
    shared = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    })
  }
  return shared
}

export async function disconnectBullConnection(): Promise<void> {
  if (shared) {
    await shared.quit()
    shared = null
  }
}
