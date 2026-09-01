import { prisma } from '@/lib/prisma'
import { enqueueRunAgent } from '../queue/enqueue'
import type { WatchdogJobData } from '../queue/queues'

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function thresholdMinutes(
  status: string,
  cfg: {
    threshold_bot_min: number
    threshold_pending_min: number
    threshold_open_min: number
  },
): number {
  if (status === 'bot') return cfg.threshold_bot_min
  if (status === 'pending') return cfg.threshold_pending_min
  if (status === 'open') return cfg.threshold_open_min
  return 15
}

/**
 * Equivalente ao watchdog_timer / watchdog_cron do SST.
 * Marca conversas presas e re-dispara o agente quando status=bot.
 */
export async function processWatchdog(
  data: WatchdogJobData,
): Promise<{ scanned: number; stuck: number }> {
  const configs = await prisma.ocWatchdogConfig.findMany({
    where: { habilitado: true },
  })

  let scanned = 0
  let stuck = 0

  for (const cfg of configs) {
    const conversas = await prisma.ocConversa.findMany({
      where: {
        organization_id: cfg.organization_id,
        status: { in: ['bot', 'pending', 'open'] },
        closed_at: null,
      },
      include: { canal: true },
      take: 200,
      orderBy: { last_message_at: 'asc' },
    })

    const now = Date.now()
    for (const conversa of conversas) {
      scanned += 1
      const ref = conversa.last_message_at ?? conversa.created_at
      const ageMin = (now - ref.getTime()) / 60_000
      const limit = thresholdMinutes(conversa.status, cfg)
      if (ageMin < limit) continue

      stuck += 1
      const attempts = (conversa.stuck_attempts ?? 0) + 1
      const maxed = attempts >= cfg.max_tentativas

      await prisma.ocConversa.update({
        where: { id: conversa.id },
        data: {
          is_stuck: true,
          stuck_attempts: attempts,
          ...(maxed && conversa.status === 'bot'
            ? { status: 'pending' }
            : {}),
        },
      })

      if (
        data.kind === 'timer' &&
        conversa.status === 'bot' &&
        conversa.canal.ia_habilitada &&
        !maxed
      ) {
        await enqueueRunAgent({
          conversaId: conversa.id,
          organizationId: conversa.organization_id,
          context: 'watchdog_retry',
        })
      }
    }
  }

  // Orgs sem OcWatchdogConfig ainda — usa defaults leves
  if (configs.length === 0) {
    const orgs = await prisma.ocCanal.findMany({
      where: { ativo: true },
      select: { organization_id: true },
      distinct: ['organization_id'],
    })
    for (const { organization_id } of orgs) {
      await prisma.ocWatchdogConfig.upsert({
        where: { organization_id },
        create: { organization_id },
        update: {},
      })
    }
  }

  console.info(
    `[watchdog:${data.kind}] scanned=${scanned} stuck=${stuck} configs=${configs.length}`,
  )
  return { scanned, stuck }
}

/** Stub leve — execução real de automações pode expandir depois. */
export async function processAutomation(data: {
  organizationId: string
  automacaoId: string
  conversaId?: string
  contexto?: Record<string, unknown>
}): Promise<{ ok: boolean; resultados: unknown[] }> {
  const automacao = await prisma.ocAutomacao.findFirst({
    where: {
      id: data.automacaoId,
      organization_id: data.organizationId,
      ativa: true,
    },
  })
  if (!automacao) return { ok: false, resultados: [] }

  const acoes = Array.isArray(automacao.acoes) ? automacao.acoes : []
  console.info(
    '[automation] id=%s conversa=%s acoes=%s ctx=%j',
    automacao.id,
    data.conversaId,
    acoes.length,
    asRecord(data.contexto),
  )

  return {
    ok: true,
    resultados: acoes.map((a) => ({ ok: true, tipo: typeof a === 'object' ? (a as { tipo?: string }).tipo : 'unknown' })),
  }
}
