import { randomBytes } from 'node:crypto'
import { Prisma, type OcContato } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import {
  evolutionConnectInstance,
  evolutionCreateInstance,
  evolutionDeleteInstance,
  evolutionFetchOwner,
  evolutionFetchProfilePictureUrl,
  evolutionFetchStatus,
  evolutionGetBase64FromMediaMessage,
  evolutionSendMedia,
  evolutionSendWhatsappAudio,
  evolutionSetWebhook,
  evolutionWebhookUrl,
  extractQrFromConnectResponse,
  formatPhoneBr,
  isEvolutionConfigured,
  normalizeWhatsappStatus,
  parseEvolutionWebhook,
  toWhatsappNumber,
} from './evolution-client'
import {
  enqueueOutboundSend,
  enqueueRunAgent,
  enqueueRunAutomation,
} from '@/omnichannel/queue/enqueue'
import { isEmailOutboundConfigured } from './email-outbound'
import {
  serializeAgente,
  serializeAutomacao,
  serializeCanal,
  serializeCard,
  serializeConfigIA,
  serializeContato,
  serializeConversa,
  serializeExecucao,
  serializeInbox,
  serializeMensagem,
  serializePipeline,
  serializeSkill,
  serializeStage,
  serializeTag,
  serializeTool,
  serializeWatchdog,
  toInputJson,
  type PipelineCardSummary,
} from './oc-serialize'

const LANDING_FORM_TIPO = 'landing_form'
const WHATSAPP_TIPO = 'whatsapp_evolution'

export type LandingContatoPayload = {
  nome: string
  empresa: string
  email: string
  telefone: string
  servico: string
  mensagem: string
}

type ConversasFiltros = {
  status?: string
  statuses?: string
  canal_id?: string
  tag?: string
  tags?: string
  tipo_conversa?: string
  inbox_id?: string
  atribuicao?: string
  q?: string
  limit?: number
  offset?: number
  currentUserId?: string
}

function publicApiBase(): string {
  return (
    process.env.EVOLUTION_WEBHOOK_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333'
  ).replace(/\/$/, '')
}

function landingIngestUrl(slug: string): string {
  return `${publicApiBase()}/public/landing/${slug}/contato`
}

function digitsPhone(value: string): string {
  return toWhatsappNumber(value)
}

function slugInstanceName(nome: string, organizationId: string): string {
  const base = nome
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || 'whatsapp'
  const suffix = organizationId.replace(/-/g, '').slice(0, 8)
  return `${base}-${suffix}`
}

function formatLandingLeadMessage(data: LandingContatoPayload): string {
  return [
    'Novo lead pelo formulário da landing',
    '',
    `Nome: ${data.nome}`,
    `Empresa: ${data.empresa}`,
    `E-mail: ${data.email}`,
    `Telefone: ${data.telefone}`,
    `Serviço: ${data.servico}`,
    '',
    'Mensagem:',
    data.mensagem,
  ].join('\n')
}

function parseCsv(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function mimeToMediaKind(
  mimetype: string,
): 'image' | 'video' | 'audio' | 'document' {
  const mt = (mimetype || '').toLowerCase()
  if (mt.startsWith('image/')) return 'image'
  if (mt.startsWith('video/')) return 'video'
  if (mt.startsWith('audio/')) return 'audio'
  return 'document'
}

const AVATAR_CACHE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Atualiza avatar_url do contato via Evolution (cache ~7 dias).
 * Retorna o contato atualizado (ou o original se não houver mudança).
 */
async function maybeRefreshContatoAvatar(opts: {
  contato: OcContato
  instanceName: string
  instanceToken?: string | null
}): Promise<OcContato> {
  const { contato, instanceName, instanceToken } = opts
  const phone = digitsPhone(contato.telefone || '')
  if (!phone || !instanceName) return contato

  const extra = asRecord(contato.extra_data)
  if (contato.avatar_url) {
    const fetchedAt = extra.avatar_fetched_at
    if (typeof fetchedAt === 'string') {
      const dt = Date.parse(fetchedAt)
      if (!Number.isNaN(dt) && Date.now() - dt < AVATAR_CACHE_MS) {
        return contato
      }
    }
  }

  try {
    const url = await evolutionFetchProfilePictureUrl(
      instanceName,
      phone,
      instanceToken,
    )
    if (!url) return contato
    const avatarUrl = url.slice(0, 500)
    return prisma.ocContato.update({
      where: { id: contato.id },
      data: {
        avatar_url: avatarUrl,
        extra_data: toInputJson({
          ...extra,
          avatar_fetched_at: new Date().toISOString(),
        }),
      },
    })
  } catch (err) {
    console.warn('[oc] refresh avatar falhou contato=', contato.id, err)
    return contato
  }
}

export class OmnichannelService {
  // ── Canais ────────────────────────────────────────────────────────────────

  async listCanais(organizationId: string, orgSlug?: string) {
    const rows = await prisma.ocCanal.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    })
    return rows.map((canal) => {
      const base = serializeCanal(canal)
      if (canal.tipo === LANDING_FORM_TIPO && orgSlug) {
        return {
          ...base,
          ingest_url: landingIngestUrl(orgSlug),
          has_ingest_secret: Boolean(asRecord(canal.config).ingest_secret),
        }
      }
      return base
    })
  }

  async createCanal(
    organizationId: string,
    data: {
      nome: string
      tipo: string
      ativo?: boolean
      ia_habilitada?: boolean
      config?: Record<string, unknown>
    },
  ) {
    const canal = await prisma.ocCanal.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        tipo: data.tipo,
        ativo: data.ativo ?? true,
        ia_habilitada: data.ia_habilitada ?? true,
        config: toInputJson(data.config ?? {}),
      },
    })
    return serializeCanal(canal)
  }

  async getCanal(organizationId: string, canalId: string, orgSlug?: string) {
    const canal = await prisma.ocCanal.findFirst({
      where: { id: canalId, organization_id: organizationId },
    })
    if (!canal) throw new BadRequestError('Canal não encontrado')
    const base = serializeCanal(canal)
    if (canal.tipo === LANDING_FORM_TIPO) {
      const cfg = asRecord(canal.config)
      return {
        ...base,
        ingest_url: orgSlug ? landingIngestUrl(orgSlug) : undefined,
        ingest_secret:
          typeof cfg.ingest_secret === 'string' ? cfg.ingest_secret : undefined,
        has_ingest_secret: Boolean(cfg.ingest_secret),
      }
    }
    return base
  }

  async patchCanal(
    organizationId: string,
    canalId: string,
    data: Partial<{
      nome: string
      tipo: string
      ativo: boolean
      ia_habilitada: boolean
      config: Record<string, unknown>
    }>,
  ) {
    await this.getCanal(organizationId, canalId)
    const canal = await prisma.ocCanal.update({
      where: { id: canalId },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
        ...(data.ia_habilitada !== undefined ? { ia_habilitada: data.ia_habilitada } : {}),
        ...(data.config !== undefined ? { config: toInputJson(data.config) } : {}),
      },
    })
    return serializeCanal(canal)
  }

  async deleteCanal(organizationId: string, canalId: string) {
    const canal = await prisma.ocCanal.findFirst({
      where: { id: canalId, organization_id: organizationId },
    })
    if (!canal) throw new BadRequestError('Canal não encontrado')

    if (canal.tipo === WHATSAPP_TIPO && isEvolutionConfigured()) {
      const cfg = asRecord(canal.config)
      const instanceName =
        typeof cfg.instance_name === 'string' ? cfg.instance_name : null
      if (instanceName) {
        await evolutionDeleteInstance(instanceName)
      }
    }

    // Remove conversas do canal (mensagens em cascade). Cards/execuções ficam desvinculados.
    await prisma.ocConversa.deleteMany({
      where: { organization_id: organizationId, canal_id: canalId },
    })

    // Inboxes cujo filtro apontava só para este canal
    const inboxes = await prisma.ocInbox.findMany({
      where: { organization_id: organizationId },
    })
    for (const inbox of inboxes) {
      const f = asRecord(inbox.filtros)
      const ids = Array.isArray(f.canal_ids)
        ? f.canal_ids.map(String)
        : typeof f.canal_id === 'string'
          ? [String(f.canal_id)]
          : []
      if (!ids.includes(canalId)) continue

      const remaining = ids.filter((id) => id !== canalId)
      if (remaining.length === 0) {
        await prisma.ocInbox.delete({ where: { id: inbox.id } })
      } else {
        const { canal_id: _drop, ...rest } = f
        await prisma.ocInbox.update({
          where: { id: inbox.id },
          data: {
            filtros: toInputJson({
              ...rest,
              canal_ids: remaining,
            }),
          },
        })
      }
    }

    await prisma.ocCanal.delete({ where: { id: canalId } })
  }

  async createWhatsapp(
    organizationId: string,
    data: { nome: string; token?: string },
  ) {
    if (!isEvolutionConfigured()) {
      throw new BadRequestError(
        'Evolution API não configurada. Defina EVOLUTION_API_BASE_URL e EVOLUTION_API_GLOBAL_KEY no .env da API.',
      )
    }

    let instanceName = slugInstanceName(data.nome, organizationId)
    const webhookUrl = evolutionWebhookUrl()

    let created = await evolutionCreateInstance(instanceName, webhookUrl)
    if (created.exists) {
      await evolutionDeleteInstance(instanceName)
      created = await evolutionCreateInstance(instanceName, webhookUrl)
    }
    if (created.exists) {
      instanceName = `${instanceName}-r`
      created = await evolutionCreateInstance(instanceName, webhookUrl)
      if (created.exists) {
        throw new BadRequestError(
          `A Evolution API bloqueou o nome da instância. Reinicie o servidor Evolution e tente novamente.`,
        )
      }
    }

    const canal = await prisma.ocCanal.create({
      data: {
        organization_id: organizationId,
        nome: data.nome.trim(),
        tipo: WHATSAPP_TIPO,
        ativo: true,
        ia_habilitada: true,
        config: toInputJson({
          provider: 'evolution',
          instance_name: instanceName,
          instance_token: data.token?.trim() || null,
          instance_status: 'disconnected',
          webhook_url: webhookUrl,
        }),
      },
    })

    await this.provisionInboxForCanal(organizationId, canal.id, canal.nome)

    return serializeCanal(canal)
  }

  private async provisionInboxForCanal(
    organizationId: string,
    canalId: string,
    nome: string,
    opts?: { icone?: string; cor?: string },
  ) {
    const inboxes = await prisma.ocInbox.findMany({
      where: { organization_id: organizationId },
    })
    const already = inboxes.some((inbox) => {
      const f = asRecord(inbox.filtros)
      const ids = Array.isArray(f.canal_ids) ? f.canal_ids.map(String) : []
      return ids.includes(canalId)
    })
    if (already) return

    const maxOrdem = inboxes.reduce((m, i) => Math.max(m, i.ordem), 0)
    await prisma.ocInbox.create({
      data: {
        organization_id: organizationId,
        nome,
        icone: opts?.icone ?? 'message',
        cor: opts?.cor ?? 'green',
        filtros: toInputJson({ canal_ids: [canalId] }),
        ordem: maxOrdem + 1,
      },
    })
  }

  private async patchCanalConfig(
    canalId: string,
    current: Record<string, unknown>,
    patch: Record<string, unknown>,
  ) {
    const next = { ...current, ...patch }
    await prisma.ocCanal.update({
      where: { id: canalId },
      data: { config: toInputJson(next) },
    })
    return next
  }

  private async requireWhatsappCanal(organizationId: string, canalId: string) {
    const canal = await prisma.ocCanal.findFirst({
      where: { id: canalId, organization_id: organizationId },
    })
    if (!canal) throw new BadRequestError('Canal não encontrado')
    if (canal.tipo !== WHATSAPP_TIPO) {
      throw new BadRequestError('Canal não é WhatsApp (Evolution).')
    }
    const cfg = asRecord(canal.config)
    const instanceName =
      typeof cfg.instance_name === 'string' ? cfg.instance_name : null
    if (!instanceName) {
      throw new BadRequestError(
        'Canal sem instância Evolution vinculada. Recrie o canal.',
      )
    }
    if (!isEvolutionConfigured()) {
      throw new BadRequestError(
        'Evolution API não configurada. Defina EVOLUTION_API_BASE_URL e EVOLUTION_API_GLOBAL_KEY no .env.',
      )
    }
    return { canal, cfg, instanceName }
  }

  async createLandingForm(
    organizationId: string,
    orgSlug: string,
    data: { nome: string },
  ) {
    const ingestSecret = randomBytes(24).toString('hex')
    const canal = await prisma.ocCanal.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        tipo: LANDING_FORM_TIPO,
        ativo: true,
        ia_habilitada: false,
        config: toInputJson({
          provider: 'landing',
          ingest_secret: ingestSecret,
          instance_status: 'connected',
        }),
      },
    })

    await this.provisionInboxForCanal(organizationId, canal.id, canal.nome, {
      icone: 'mail',
      cor: 'blue',
    })

    return {
      ...serializeCanal(canal),
      ingest_url: landingIngestUrl(orgSlug),
      ingest_secret: ingestSecret,
    }
  }

  landingIngestMeta(orgSlug: string) {
    return { ingest_url: landingIngestUrl(orgSlug) }
  }

  /**
   * Ingestão pública do formulário da landing → conversa omnichannel.
   * Autenticado pelo ingest_secret do canal `landing_form`.
   */
  async ingestLandingContato(
    orgSlug: string,
    ingestSecret: string | undefined,
    data: LandingContatoPayload,
  ) {
    if (!ingestSecret?.trim()) {
      throw new BadRequestError('Secret de ingestão obrigatório.')
    }

    const organization = await prisma.organization.findFirst({
      where: { slug: orgSlug },
      select: { id: true, slug: true },
    })
    if (!organization) {
      throw new BadRequestError('Organização não encontrada.')
    }

    const canais = await prisma.ocCanal.findMany({
      where: {
        organization_id: organization.id,
        tipo: LANDING_FORM_TIPO,
        ativo: true,
      },
    })
    const canal = canais.find((c) => {
      const cfg = asRecord(c.config)
      return cfg.ingest_secret === ingestSecret
    })
    if (!canal) {
      throw new BadRequestError(
        'Canal de formulário da landing não encontrado ou secret inválido. Crie o canal em Atendimento → Canais.',
      )
    }

    const telefone = digitsPhone(data.telefone) || data.telefone.trim()
    const email = data.email.trim().toLowerCase()

    let contato = telefone
      ? await prisma.ocContato.findFirst({
          where: { organization_id: organization.id, telefone },
        })
      : null
    if (!contato && email) {
      contato = await prisma.ocContato.findFirst({
        where: { organization_id: organization.id, email },
      })
    }

    if (contato) {
      contato = await prisma.ocContato.update({
        where: { id: contato.id },
        data: {
          nome: data.nome.trim(),
          email,
          telefone: telefone || contato.telefone,
          tags: [...new Set([...(contato.tags ?? []), 'lead-landing'])],
          extra_data: toInputJson({
            ...asRecord(contato.extra_data),
            empresa: data.empresa,
            ultimo_servico: data.servico,
          }),
        },
      })
    } else {
      contato = await prisma.ocContato.create({
        data: {
          organization_id: organization.id,
          nome: data.nome.trim(),
          email,
          telefone: telefone || null,
          tags: ['lead-landing'],
          extra_data: toInputJson({
            empresa: data.empresa,
            ultimo_servico: data.servico,
          }),
        },
      })
    }

    const now = new Date()
    const conversa = await prisma.ocConversa.create({
      data: {
        organization_id: organization.id,
        canal_id: canal.id,
        contato_id: contato.id,
        status: 'pending',
        tags: ['lead-landing', data.servico].filter(Boolean),
        last_message_at: now,
        extra_data: toInputJson({
          origem: 'landing_form',
          empresa: data.empresa,
          servico: data.servico,
          email,
        }),
      },
    })

    const mensagem = await prisma.ocMensagem.create({
      data: {
        organization_id: organization.id,
        conversa_id: conversa.id,
        autor_tipo: 'contato',
        autor_id: contato.id,
        tipo: 'text',
        conteudo: formatLandingLeadMessage(data),
        is_read: false,
        extra_data: toInputJson({
          origem: 'landing_form',
          lead: data,
        }),
      },
    })

    await this.ensureLeadCard(organization.id, conversa.id, {
      titulo:
        data.nome.trim() ||
        (data.servico ? `Lead · ${data.servico}` : 'Lead landing'),
    })

    return {
      ok: true as const,
      conversa_id: conversa.id,
      contato_id: contato.id,
      mensagem_id: mensagem.id,
      canal_id: canal.id,
    }
  }

  webhookUrl() {
    return { webhook_url: evolutionWebhookUrl() }
  }

  async canalQr(organizationId: string, canalId: string) {
    const { canal, cfg, instanceName } = await this.requireWhatsappCanal(
      organizationId,
      canalId,
    )

    const live = normalizeWhatsappStatus(
      await evolutionFetchStatus(instanceName),
    )
    if (live === 'open' || live === 'connected') {
      const owner = await evolutionFetchOwner(instanceName)
      await this.patchCanalConfig(canal.id, cfg, {
        instance_status: live,
        phone: owner ? formatPhoneBr(owner) : cfg.phone ?? null,
        sync_error: null,
      })
      return { qrcode: null as string | null, pairing_code: null as string | null }
    }

    const data = await evolutionConnectInstance(instanceName)
    const extracted = extractQrFromConnectResponse(data)

    if (extracted.already_connected) {
      await this.patchCanalConfig(canal.id, cfg, {
        instance_status: 'open',
        sync_error: null,
      })
      return { qrcode: null, pairing_code: null }
    }

    await this.patchCanalConfig(canal.id, cfg, {
      instance_status: extracted.qrcode ? 'connecting' : cfg.instance_status,
      sync_error: null,
    })

    return {
      qrcode: extracted.qrcode,
      pairing_code: extracted.pairing_code,
    }
  }

  async canalSync(organizationId: string, canalId: string) {
    const { canal, cfg, instanceName } = await this.requireWhatsappCanal(
      organizationId,
      canalId,
    )
    try {
      const webhookUrl = evolutionWebhookUrl()
      try {
        await evolutionSetWebhook(instanceName, webhookUrl)
      } catch (err) {
        console.warn(
          '[evolution] reaplicar webhook falhou instance=',
          instanceName,
          err,
        )
      }

      const status = normalizeWhatsappStatus(
        await evolutionFetchStatus(instanceName),
      )
      let phone =
        typeof cfg.phone === 'string' ? cfg.phone : undefined
      if (status === 'open' || status === 'connected') {
        const owner = await evolutionFetchOwner(instanceName)
        if (owner) phone = formatPhoneBr(owner)
      }
      await this.patchCanalConfig(canal.id, cfg, {
        instance_status: status,
        phone: phone ?? null,
        webhook_url: webhookUrl,
        sync_error: null,
      })
      return { ok: true, status, phone: phone ?? null, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 300) : String(err)
      await this.patchCanalConfig(canal.id, cfg, { sync_error: msg })
      return {
        ok: false,
        status: typeof cfg.instance_status === 'string' ? cfg.instance_status : 'disconnected',
        phone: typeof cfg.phone === 'string' ? cfg.phone : null,
        error: msg,
      }
    }
  }

  async canalTest(organizationId: string, canalId: string) {
    const { canal, cfg, instanceName } = await this.requireWhatsappCanal(
      organizationId,
      canalId,
    )
    try {
      const status = normalizeWhatsappStatus(
        await evolutionFetchStatus(instanceName),
      )
      const connected = status === 'open' || status === 'connected'
      let phone = typeof cfg.phone === 'string' ? cfg.phone : undefined
      if (connected) {
        const owner = await evolutionFetchOwner(instanceName)
        if (owner) phone = formatPhoneBr(owner)
      }
      await this.patchCanalConfig(canal.id, cfg, {
        instance_status: status,
        phone: phone ?? null,
        sync_error: null,
      })
      return {
        ok: connected,
        status,
        message: connected ? 'Conexão ativa' : `Status: ${status}`,
      }
    } catch (err) {
      return {
        ok: false,
        status:
          typeof cfg.instance_status === 'string'
            ? cfg.instance_status
            : 'disconnected',
        message: err instanceof Error ? err.message.slice(0, 300) : String(err),
      }
    }
  }

  /**
   * Webhook público da Evolution API → cria/atualiza conversas omnichannel.
   */
  async handleEvolutionWebhook(body: Record<string, unknown>) {
    const event = parseEvolutionWebhook(body)
    if (!event) return { ok: true, handled: false }

    if (event.eventType === 'connection.update') {
      const canais = await prisma.ocCanal.findMany({
        where: { tipo: WHATSAPP_TIPO, ativo: true },
      })
      for (const canal of canais) {
        const cfg = asRecord(canal.config)
        if (cfg.instance_name !== event.instance) continue
        await this.patchCanalConfig(canal.id, cfg, {
          instance_status: normalizeWhatsappStatus(event.text),
          sync_error: null,
        })
        break
      }
      return { ok: true, handled: true }
    }

    if (event.eventType !== 'messages.upsert' || event.fromMe || !event.text) {
      return { ok: true, handled: false }
    }

    const canais = await prisma.ocCanal.findMany({
      where: { tipo: WHATSAPP_TIPO, ativo: true },
    })
    const canal = canais.find(
      (c) => asRecord(c.config).instance_name === event.instance,
    )
    if (!canal) {
      console.warn(
        '[evolution webhook] nenhum canal para instance=',
        event.instance,
      )
      return { ok: true, handled: false }
    }

    const phone = digitsPhone(event.phone)
    if (!phone) return { ok: true, handled: false }

    if (event.messageId) {
      const dup = await prisma.ocMensagem.findFirst({
        where: { canal_msg_id: event.messageId },
      })
      if (dup) return { ok: true, handled: true, duplicate: true }
    }

    let contato = await prisma.ocContato.findFirst({
      where: { organization_id: canal.organization_id, telefone: phone },
    })
    if (!contato) {
      contato = await prisma.ocContato.create({
        data: {
          organization_id: canal.organization_id,
          nome: event.pushName || phone,
          telefone: phone,
          tags: ['whatsapp'],
        },
      })
    } else if (event.pushName && !contato.nome) {
      contato = await prisma.ocContato.update({
        where: { id: contato.id },
        data: { nome: event.pushName },
      })
    }

    // Avatar WhatsApp (Evolution) — não bloqueia o fluxo se falhar
    {
      const canalCfg = asRecord(canal.config)
      const instanceName =
        typeof canalCfg.instance_name === 'string' ? canalCfg.instance_name : null
      const instanceToken =
        typeof canalCfg.instance_token === 'string' ? canalCfg.instance_token : null
      if (instanceName) {
        contato = await maybeRefreshContatoAvatar({
          contato,
          instanceName,
          instanceToken,
        })
      }
    }

    let conversa = await prisma.ocConversa.findFirst({
      where: {
        organization_id: canal.organization_id,
        canal_id: canal.id,
        contato_id: contato.id,
        status: { not: 'closed' },
      },
      orderBy: { last_message_at: 'desc' },
    })

    const now = new Date()
    let createdConversa = false
    if (!conversa) {
      conversa = await prisma.ocConversa.create({
        data: {
          organization_id: canal.organization_id,
          canal_id: canal.id,
          contato_id: contato.id,
          status: canal.ia_habilitada ? 'bot' : 'pending',
          tags: ['whatsapp'],
          last_message_at: now,
          canal_ext_id: event.remoteJid || null,
          extra_data: toInputJson({ origem: 'whatsapp_evolution' }),
        },
      })
      createdConversa = true
    }

    await prisma.ocMensagem.create({
      data: {
        organization_id: canal.organization_id,
        conversa_id: conversa.id,
        autor_tipo: 'contato',
        autor_id: contato.id,
        tipo: 'text',
        conteudo: event.text,
        canal_msg_id: event.messageId || null,
        is_read: false,
        extra_data: toInputJson({ remote_jid: event.remoteJid }),
      },
    })
    await prisma.ocConversa.update({
      where: { id: conversa.id },
      data: { last_message_at: now },
    })

    if (createdConversa) {
      await this.ensureLeadCard(canal.organization_id, conversa.id, {
        titulo: contato.nome || contato.telefone || 'Lead WhatsApp',
      })
    }

    // Dispara agente IA em fila (oc-worker) quando canal/conversa em modo bot
    if (canal.ia_habilitada && conversa.status === 'bot') {
      await enqueueRunAgent({
        conversaId: conversa.id,
        organizationId: canal.organization_id,
        context: 'webhook_inbound',
      })
    }

    return { ok: true, handled: true, conversa_id: conversa.id }
  }

  // ── Contatos ──────────────────────────────────────────────────────────────

  async listContatos(
    organizationId: string,
    opts?: { q?: string; limit?: number; offset?: number },
  ) {
    const limit = opts?.limit ?? 50
    const offset = opts?.offset ?? 0
    const q = opts?.q?.trim()
    const rows = await prisma.ocContato.findMany({
      where: {
        organization_id: organizationId,
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: 'insensitive' } },
                { telefone: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
    })
    return rows.map(serializeContato)
  }

  async createContato(
    organizationId: string,
    data: {
      nome?: string
      telefone?: string
      email?: string
      avatar_url?: string
      tags?: string[]
    },
  ) {
    const contato = await prisma.ocContato.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        avatar_url: data.avatar_url,
        tags: data.tags ?? [],
      },
    })
    return serializeContato(contato)
  }

  async getContato(organizationId: string, contatoId: string) {
    const contato = await prisma.ocContato.findFirst({
      where: { id: contatoId, organization_id: organizationId },
    })
    if (!contato) throw new BadRequestError('Contato não encontrado')
    return serializeContato(contato)
  }

  // ── Conversas ─────────────────────────────────────────────────────────────

  private async enrichConversas(
    organizationId: string,
    conversas: Array<
      Prisma.OcConversaGetPayload<{ include: { contato: true; canal: true } }>
    >,
  ) {
    if (conversas.length === 0) return []

    const ids = conversas.map((c) => c.id)

    const [lastMsgs, unreadGroups, cards, pipelines] = await Promise.all([
      prisma.ocMensagem.findMany({
        where: {
          conversa_id: { in: ids },
          tipo: { not: 'system' },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.ocMensagem.groupBy({
        by: ['conversa_id'],
        where: {
          conversa_id: { in: ids },
          autor_tipo: 'contato',
          is_read: false,
        },
        _count: { _all: true },
      }),
      prisma.ocPipelineCard.findMany({
        where: {
          organization_id: organizationId,
          conversa_id: { in: ids },
        },
        include: { stage: true, pipeline: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.ocPipeline.findMany({
        where: { organization_id: organizationId },
        orderBy: { created_at: 'asc' },
        take: 1,
      }),
    ])

    const lastByConversa = new Map<string, (typeof lastMsgs)[number]>()
    for (const msg of lastMsgs) {
      if (!lastByConversa.has(msg.conversa_id)) {
        lastByConversa.set(msg.conversa_id, msg)
      }
    }

    const unreadMap = new Map(
      unreadGroups.map((g) => [g.conversa_id, g._count._all]),
    )

    const defaultPipelineId = pipelines[0]?.id
    const cardByConversa = new Map<string, PipelineCardSummary>()
    for (const card of cards) {
      if (!card.conversa_id) continue
      if (defaultPipelineId && card.pipeline_id !== defaultPipelineId) continue
      if (cardByConversa.has(card.conversa_id)) continue
      cardByConversa.set(card.conversa_id, {
        card_id: card.id,
        pipeline_id: card.pipeline_id,
        pipeline_nome: card.pipeline.nome,
        stage_id: card.stage_id,
        stage_nome: card.stage.nome,
        stage_cor: card.stage.cor,
        stage_tipo: card.stage.tipo,
      })
    }

    const atendenteIds = [
      ...new Set(
        conversas.map((c) => c.atendente_id).filter((id): id is string => !!id),
      ),
    ]
    const users =
      atendenteIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: atendenteIds } },
            select: { id: true, username: true, email: true },
          })
        : []
    const atendenteNomes = new Map(
      users.map((u) => [u.id, u.username || u.email]),
    )

    return conversas.map((c) =>
      serializeConversa(c, {
        ultima_mensagem: lastByConversa.get(c.id)?.conteudo ?? null,
        nao_lidas: unreadMap.get(c.id) ?? 0,
        atendente_nome: c.atendente_id
          ? atendenteNomes.get(c.atendente_id) ?? null
          : null,
        pipeline_card: cardByConversa.get(c.id) ?? null,
      }),
    )
  }

  async listConversas(organizationId: string, filtros: ConversasFiltros = {}) {
    let statuses = parseCsv(filtros.statuses)
    let tagsList = parseCsv(filtros.tags)
    let canalIds: string[] | undefined
    let atribuicao = filtros.atribuicao
    let tag = filtros.tag

    if (filtros.inbox_id) {
      const inbox = await prisma.ocInbox.findFirst({
        where: { id: filtros.inbox_id, organization_id: organizationId },
      })
      if (!inbox) throw new BadRequestError('Inbox não encontrada')
      const f = asRecord(inbox.filtros)
      if (Array.isArray(f.statuses) && f.statuses.length) {
        statuses = f.statuses.map(String)
      } else if (typeof f.status === 'string') {
        statuses = [f.status]
      }
      if (Array.isArray(f.canal_ids) && f.canal_ids.length) {
        canalIds = f.canal_ids.map(String)
      } else if (typeof f.canal_id === 'string') {
        canalIds = [f.canal_id]
      }
      if (Array.isArray(f.tags) && f.tags.length) {
        tagsList = f.tags.map(String)
      }
      if (typeof f.atribuicao === 'string') atribuicao = f.atribuicao
    } else if (filtros.canal_id) {
      canalIds = [filtros.canal_id]
    }

    if (!statuses?.length && filtros.status && filtros.status !== 'todos') {
      statuses = [filtros.status]
    }

    const where: Prisma.OcConversaWhereInput = {
      organization_id: organizationId,
      ...(statuses?.length ? { status: { in: statuses } } : {}),
      ...(canalIds?.length ? { canal_id: { in: canalIds } } : {}),
      ...(tagsList?.length
        ? { tags: { hasSome: tagsList } }
        : tag
          ? { tags: { has: tag } }
          : {}),
    }

    if (atribuicao === 'minha' && filtros.currentUserId) {
      where.atendente_id = filtros.currentUserId
    } else if (atribuicao === 'nao_atribuida') {
      where.atendente_id = null
    }

    if (filtros.q?.trim()) {
      const q = filtros.q.trim()
      where.contato = {
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { telefone: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    }

    const rows = await prisma.ocConversa.findMany({
      where,
      include: { contato: true, canal: true },
      orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
      take: filtros.limit ?? 50,
      skip: filtros.offset ?? 0,
    })

    // Preenche avatares faltantes (máx. 8 por listagem — cache 7 dias)
    const seenContato = new Set<string>()
    const refreshJobs: Promise<void>[] = []
    for (const row of rows) {
      if (refreshJobs.length >= 8) break
      if (row.canal.tipo !== WHATSAPP_TIPO) continue
      if (!row.contato || row.contato.avatar_url || !row.contato.telefone) continue
      if (seenContato.has(row.contato.id)) continue
      seenContato.add(row.contato.id)
      const cfg = asRecord(row.canal.config)
      const instanceName =
        typeof cfg.instance_name === 'string' ? cfg.instance_name : null
      const instanceToken =
        typeof cfg.instance_token === 'string' ? cfg.instance_token : null
      if (!instanceName) continue
      refreshJobs.push(
        maybeRefreshContatoAvatar({
          contato: row.contato,
          instanceName,
          instanceToken,
        }).then((updated) => {
          if (row.contato) row.contato = updated
        }),
      )
    }
    if (refreshJobs.length) await Promise.allSettled(refreshJobs)

    return this.enrichConversas(organizationId, rows)
  }

  async getConversa(organizationId: string, conversaId: string) {
    let row = await prisma.ocConversa.findFirst({
      where: { id: conversaId, organization_id: organizationId },
      include: { contato: true, canal: true },
    })
    if (!row) throw new BadRequestError('Conversa não encontrada')

    if (
      row.canal.tipo === WHATSAPP_TIPO &&
      row.contato &&
      !row.contato.avatar_url &&
      row.contato.telefone
    ) {
      const cfg = asRecord(row.canal.config)
      const instanceName =
        typeof cfg.instance_name === 'string' ? cfg.instance_name : null
      const instanceToken =
        typeof cfg.instance_token === 'string' ? cfg.instance_token : null
      if (instanceName) {
        const contato = await maybeRefreshContatoAvatar({
          contato: row.contato,
          instanceName,
          instanceToken,
        })
        row = { ...row, contato }
      }
    }

    const [enriched] = await this.enrichConversas(organizationId, [row])
    return enriched
  }

  async patchConversa(
    organizationId: string,
    conversaId: string,
    data: Record<string, unknown>,
  ) {
    await this.getConversa(organizationId, conversaId)
    const update: Prisma.OcConversaUpdateInput = {}
    if (typeof data.status === 'string') update.status = data.status
    if (data.agente_ia_id !== undefined) {
      update.agente_ia = data.agente_ia_id
        ? { connect: { id: String(data.agente_ia_id) } }
        : { disconnect: true }
    }
    if (data.atendente_id !== undefined) {
      update.atendente_id =
        data.atendente_id === null ? null : String(data.atendente_id)
    }
    if (Array.isArray(data.tags)) update.tags = data.tags.map(String)
    if (typeof data.is_stuck === 'boolean') update.is_stuck = data.is_stuck

    await prisma.ocConversa.update({
      where: { id: conversaId },
      data: update,
    })
    return this.getConversa(organizationId, conversaId)
  }

  async encerrarConversa(organizationId: string, conversaId: string) {
    await this.getConversa(organizationId, conversaId)
    await prisma.ocConversa.update({
      where: { id: conversaId },
      data: { status: 'closed', closed_at: new Date() },
    })
    return this.getConversa(organizationId, conversaId)
  }

  async reabrirConversa(organizationId: string, conversaId: string) {
    await this.getConversa(organizationId, conversaId)
    await prisma.ocConversa.update({
      where: { id: conversaId },
      data: { status: 'open', closed_at: null },
    })
    return this.getConversa(organizationId, conversaId)
  }

  async marcarLidas(organizationId: string, conversaId: string) {
    await this.getConversa(organizationId, conversaId)
    await prisma.ocMensagem.updateMany({
      where: {
        conversa_id: conversaId,
        organization_id: organizationId,
        autor_tipo: 'contato',
        is_read: false,
      },
      data: { is_read: true },
    })
  }

  async listMensagens(
    organizationId: string,
    conversaId: string,
    limit = 100,
  ) {
    await this.getConversa(organizationId, conversaId)
    const rows = await prisma.ocMensagem.findMany({
      where: { conversa_id: conversaId, organization_id: organizationId },
      orderBy: { created_at: 'asc' },
      take: Math.min(limit, 500),
    })
    return rows.map(serializeMensagem)
  }

  async createMensagem(
    organizationId: string,
    conversaId: string,
    userId: string,
    conteudo: string,
    opts?: { destino?: 'email' | 'whatsapp' },
  ) {
    const conversa = await prisma.ocConversa.findFirst({
      where: { id: conversaId, organization_id: organizationId },
      include: { canal: true, contato: true },
    })
    if (!conversa) throw new BadRequestError('Conversa não encontrada')

    const destino = await this.resolveReplyDestino(conversa, opts?.destino)

    const msg = await prisma.ocMensagem.create({
      data: {
        organization_id: organizationId,
        conversa_id: conversaId,
        autor_tipo: 'humano',
        autor_id: userId,
        tipo: 'text',
        conteudo,
        is_read: true,
        extra_data: toInputJson({
          reply_via: destino.via,
          reply_to: destino.to,
        }),
      },
    })
    await prisma.ocConversa.update({
      where: { id: conversaId },
      data: {
        last_message_at: new Date(),
        extra_data: toInputJson({
          ...asRecord(conversa.extra_data),
          preferred_reply: destino.via,
        }),
      },
    })

    if (destino.via === 'whatsapp') {
      await enqueueOutboundSend({
        channel: 'whatsapp',
        mensagemId: msg.id,
        conversaId,
        organizationId,
        instanceName: destino.instanceName!,
        instanceToken: destino.instanceToken,
        phone: destino.to,
        texto: conteudo,
      })
    } else if (destino.via === 'email') {
      await enqueueOutboundSend({
        channel: 'email',
        mensagemId: msg.id,
        conversaId,
        organizationId,
        email: destino.to,
        subject: `Resposta — ${conversa.contato.nome || 'seu contato'}`,
        texto: conteudo,
      })
    }

    return serializeMensagem(msg)
  }

  /**
   * Resolve destino de saída: WhatsApp (canal da conversa ou canal WA da org)
   * ou e-mail (leads landing).
   */
  private async resolveReplyDestino(
    conversa: {
      organization_id: string
      canal: { tipo: string; config: unknown }
      contato: { telefone: string | null; email: string | null; nome: string | null }
      extra_data: unknown
    },
    requested?: 'email' | 'whatsapp',
  ): Promise<{
    via: 'whatsapp' | 'email' | 'internal'
    to: string
    instanceName?: string
    instanceToken?: string | null
  }> {
    const phone = conversa.contato.telefone?.trim() || ''
    const email = conversa.contato.email?.trim().toLowerCase() || ''
    const preferred = asRecord(conversa.extra_data).preferred_reply
    const preferredVia =
      preferred === 'email' || preferred === 'whatsapp' ? preferred : undefined

    const pick =
      requested ||
      preferredVia ||
      (conversa.canal.tipo === WHATSAPP_TIPO
        ? 'whatsapp'
        : phone
          ? 'whatsapp'
          : email
            ? 'email'
            : undefined)

    if (pick === 'whatsapp') {
      if (!phone) {
        throw new BadRequestError('Contato sem telefone para WhatsApp')
      }
      if (!isEvolutionConfigured()) {
        throw new BadRequestError('Evolution API não configurada')
      }

      if (conversa.canal.tipo === WHATSAPP_TIPO) {
        const cfg = asRecord(conversa.canal.config)
        const instanceName =
          typeof cfg.instance_name === 'string' ? cfg.instance_name : null
        if (!instanceName) {
          throw new BadRequestError('Canal WhatsApp sem instance_name')
        }
        return {
          via: 'whatsapp',
          to: phone,
          instanceName,
          instanceToken:
            typeof cfg.instance_token === 'string' ? cfg.instance_token : null,
        }
      }

      // Landing (ou outro): usa o primeiro canal WhatsApp ativo da org
      const wa = await prisma.ocCanal.findFirst({
        where: {
          organization_id: conversa.organization_id,
          tipo: WHATSAPP_TIPO,
          ativo: true,
        },
        orderBy: { created_at: 'asc' },
      })
      if (!wa) {
        throw new BadRequestError(
          'Nenhum canal WhatsApp ativo para enviar a resposta',
        )
      }
      const cfg = asRecord(wa.config)
      const instanceName =
        typeof cfg.instance_name === 'string' ? cfg.instance_name : null
      if (!instanceName) {
        throw new BadRequestError('Canal WhatsApp sem instance_name')
      }
      return {
        via: 'whatsapp',
        to: phone,
        instanceName,
        instanceToken:
          typeof cfg.instance_token === 'string' ? cfg.instance_token : null,
      }
    }

    if (pick === 'email') {
      if (!email) {
        throw new BadRequestError('Contato sem e-mail')
      }
      if (!isEmailOutboundConfigured()) {
        throw new BadRequestError(
          'Envio de e-mail não configurado (RESEND_API_KEY)',
        )
      }
      return { via: 'email', to: email }
    }

    // Sem canal externo — só grava internamente (ex.: landing sem destino)
    return { via: 'internal', to: '' }
  }

  /**
   * Garante um card no funil padrão ligado à conversa (lead automático).
   */
  async ensureLeadCard(
    organizationId: string,
    conversaId: string,
    opts?: { titulo?: string },
  ) {
    const existing = await prisma.ocPipelineCard.findFirst({
      where: { organization_id: organizationId, conversa_id: conversaId },
    })
    if (existing) return serializeCard(existing)

    let pipeline = await prisma.ocPipeline.findFirst({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'asc' },
      include: { stages: { orderBy: { ordem: 'asc' } } },
    })

    if (!pipeline) {
      await this.provisionIaDefaults(organizationId, false)
      pipeline = await prisma.ocPipeline.findFirst({
        where: { organization_id: organizationId },
        orderBy: { created_at: 'asc' },
        include: { stages: { orderBy: { ordem: 'asc' } } },
      })
    }

    if (!pipeline) {
      console.warn('[oc] ensureLeadCard: sem pipeline org=', organizationId)
      return null
    }

    const stage =
      pipeline.stages.find((s) => s.tipo === 'normal') ?? pipeline.stages[0]
    if (!stage) {
      console.warn('[oc] ensureLeadCard: pipeline sem stages', pipeline.id)
      return null
    }

    let titulo = opts?.titulo?.trim()
    if (!titulo) {
      const conversa = await prisma.ocConversa.findFirst({
        where: { id: conversaId, organization_id: organizationId },
        include: { contato: true },
      })
      titulo =
        conversa?.contato.nome ||
        conversa?.contato.telefone ||
        conversa?.contato.email ||
        'Novo lead'
    }

    const card = await prisma.ocPipelineCard.create({
      data: {
        organization_id: organizationId,
        pipeline_id: pipeline.id,
        stage_id: stage.id,
        conversa_id: conversaId,
        titulo: titulo.slice(0, 200),
      },
    })
    return serializeCard(card)
  }

  async createNotaInterna(
    organizationId: string,
    conversaId: string,
    userId: string,
    conteudo: string,
  ) {
    await this.getConversa(organizationId, conversaId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    })
    const msg = await prisma.ocMensagem.create({
      data: {
        organization_id: organizationId,
        conversa_id: conversaId,
        autor_tipo: 'humano',
        autor_id: userId,
        tipo: 'text',
        conteudo,
        is_read: true,
        extra_data: toInputJson({
          nota_interna: true,
          autor_nome: user?.username || user?.email,
        }),
      },
    })
    return serializeMensagem(msg)
  }

  async createAnexo(
    organizationId: string,
    conversaId: string,
    userId: string,
    file: { filename: string; mimetype?: string; buffer: Buffer },
    legenda?: string,
  ) {
    const conversa = await prisma.ocConversa.findFirst({
      where: { id: conversaId, organization_id: organizationId },
      include: { canal: true, contato: true },
    })
    if (!conversa) throw new BadRequestError('Conversa não encontrada')

    const MAX_ANEXO = 16 * 1024 * 1024
    if (!file.buffer.length) throw new BadRequestError('Arquivo vazio')
    if (file.buffer.length > MAX_ANEXO) {
      throw new BadRequestError('Arquivo excede o limite de 16 MB')
    }

    const mime = (file.mimetype || 'application/octet-stream').trim()
    const fileName = (file.filename || 'arquivo').trim() || 'arquivo'
    const mediaKind = mimeToMediaKind(mime)
    const caption = (legenda || '').trim()
    const conteudo =
      caption ||
      (mediaKind === 'image'
        ? '[Imagem]'
        : mediaKind === 'video'
          ? '[Vídeo]'
          : mediaKind === 'audio'
            ? '[Áudio]'
            : fileName)

    const base64 = file.buffer.toString('base64')
    const msg = await prisma.ocMensagem.create({
      data: {
        organization_id: organizationId,
        conversa_id: conversaId,
        autor_tipo: 'humano',
        autor_id: userId,
        tipo: mediaKind,
        conteudo,
        is_read: true,
        extra_data: toInputJson({
          media: {
            media_kind: mediaKind,
            mimetype: mime,
            file_name: fileName,
            base64_inline: base64,
            size_bytes: file.buffer.length,
          },
        }),
      },
    })
    await prisma.ocConversa.update({
      where: { id: conversaId },
      data: { last_message_at: new Date() },
    })

    // Envio WhatsApp (Evolution)
    if (
      conversa.canal.tipo === WHATSAPP_TIPO &&
      conversa.contato.telefone &&
      isEvolutionConfigured()
    ) {
      const cfg = asRecord(conversa.canal.config)
      const instanceName =
        typeof cfg.instance_name === 'string' ? cfg.instance_name : null
      const instanceToken =
        typeof cfg.instance_token === 'string' ? cfg.instance_token : null
      if (instanceName) {
        let sent = false
        if (mediaKind === 'audio') {
          sent = await evolutionSendWhatsappAudio(
            instanceName,
            conversa.contato.telefone,
            base64,
            instanceToken,
          )
          if (!sent) {
            // fallback sendMedia
            sent = await evolutionSendMedia(instanceName, conversa.contato.telefone, {
              mediaBase64: base64,
              mediatype: 'audio',
              mimetype: mime,
              fileName,
              caption,
              instanceToken,
            })
          }
        } else {
          sent = await evolutionSendMedia(instanceName, conversa.contato.telefone, {
            mediaBase64: base64,
            mediatype: mediaKind,
            mimetype: mime,
            fileName,
            caption,
            instanceToken,
          })
        }
        if (!sent) {
          console.warn(
            '[oc] falha ao enviar anexo Evolution msg=',
            msg.id,
            'kind=',
            mediaKind,
          )
        } else {
          await prisma.ocMensagem.update({
            where: { id: msg.id },
            data: {
              extra_data: toInputJson({
                ...asRecord(msg.extra_data),
                media: {
                  ...asRecord(asRecord(msg.extra_data).media),
                  media_kind: mediaKind,
                  mimetype: mime,
                  file_name: fileName,
                  base64_inline: base64,
                  size_bytes: file.buffer.length,
                },
                evolution_sent: true,
                evolution_sent_at: new Date().toISOString(),
              }),
            },
          })
        }
      }
    }

    return serializeMensagem(
      (await prisma.ocMensagem.findUnique({ where: { id: msg.id } })) ?? msg,
    )
  }

  async getMensagemMedia(
    organizationId: string,
    conversaId: string,
    mensagemId: string,
  ): Promise<{ buffer: Buffer; mimetype: string; fileName?: string }> {
    const conversa = await prisma.ocConversa.findFirst({
      where: { id: conversaId, organization_id: organizationId },
      include: { canal: true, contato: true },
    })
    if (!conversa) throw new BadRequestError('Conversa não encontrada')

    const mensagem = await prisma.ocMensagem.findFirst({
      where: {
        id: mensagemId,
        conversa_id: conversaId,
        organization_id: organizationId,
      },
    })
    if (!mensagem) throw new BadRequestError('Mensagem não encontrada')

    const extra = asRecord(mensagem.extra_data)
    const media = asRecord(extra.media)

    if (media.stub === true) {
      throw new BadRequestError(
        'Anexo incompleto (versão antiga). Envie o arquivo novamente.',
      )
    }

    const inline = media.base64_inline
    if (typeof inline === 'string' && inline.length > 0) {
      const buffer = Buffer.from(inline, 'base64')
      // Stub antigo gravava só ~200 chars de base64 — inútil para abrir
      if (buffer.length < 32) {
        throw new BadRequestError(
          'Anexo incompleto. Envie o arquivo novamente.',
        )
      }
      return {
        buffer,
        mimetype:
          (typeof media.mimetype === 'string' && media.mimetype) ||
          'application/octet-stream',
        fileName:
          typeof media.file_name === 'string' ? media.file_name : undefined,
      }
    }

    // Inbound WhatsApp: baixa via Evolution com message_key / canal_msg_id
    let messageKey =
      (extra.message_key && typeof extra.message_key === 'object'
        ? (extra.message_key as Record<string, unknown>)
        : null) ||
      (media.message_key && typeof media.message_key === 'object'
        ? (media.message_key as Record<string, unknown>)
        : null)

    if (!messageKey && mensagem.canal_msg_id) {
      const remoteJid =
        (typeof asRecord(conversa.contato?.extra_data).remote_jid === 'string'
          ? String(asRecord(conversa.contato?.extra_data).remote_jid)
          : null) ||
        conversa.canal_ext_id ||
        (conversa.contato?.telefone
          ? `${digitsPhone(conversa.contato.telefone)}@s.whatsapp.net`
          : null)
      if (remoteJid) {
        messageKey = {
          remoteJid,
          fromMe: mensagem.autor_tipo === 'humano' || mensagem.autor_tipo === 'agente',
          id: mensagem.canal_msg_id,
        }
      }
    }

    if (
      !messageKey ||
      conversa.canal.tipo !== WHATSAPP_TIPO ||
      !isEvolutionConfigured()
    ) {
      throw new BadRequestError('Mídia indisponível para esta mensagem')
    }

    const cfg = asRecord(conversa.canal.config)
    const instanceName =
      typeof cfg.instance_name === 'string' ? cfg.instance_name : null
    const instanceToken =
      typeof cfg.instance_token === 'string' ? cfg.instance_token : null
    if (!instanceName) {
      throw new BadRequestError('Instância WhatsApp não configurada')
    }

    const kind = String(media.media_kind || '')
    const mimeHint = String(media.mimetype || '')
    const convertToMp4 =
      kind === 'audio' ||
      kind === 'video' ||
      mimeHint.startsWith('audio/') ||
      mimeHint.startsWith('video/')

    const result = await evolutionGetBase64FromMediaMessage(
      instanceName,
      messageKey,
      { convertToMp4, instanceToken },
    )
    if (!result?.base64) {
      throw new BadRequestError('Não foi possível baixar a mídia')
    }

    const mimetype =
      result.mimetype ||
      (typeof media.mimetype === 'string' && media.mimetype) ||
      'application/octet-stream'

    // Cache inline para próximos loads (se couber ~2MB)
    const buf = Buffer.from(result.base64, 'base64')
    if (buf.length <= 2 * 1024 * 1024) {
      await prisma.ocMensagem.update({
        where: { id: mensagem.id },
        data: {
          extra_data: toInputJson({
            ...extra,
            media: {
              ...media,
              mimetype,
              base64_inline: result.base64,
              size_bytes: buf.length,
            },
          }),
        },
      })
    }

    return {
      buffer: buf,
      mimetype,
      fileName:
        typeof media.file_name === 'string' ? media.file_name : undefined,
    }
  }

  // ── Agentes ───────────────────────────────────────────────────────────────

  async listAgentes(organizationId: string) {
    const rows = await prisma.ocAgente.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    })
    return rows.map((a) => serializeAgente(a))
  }

  async createAgente(
    organizationId: string,
    data: {
      nome: string
      system_prompt: string
      descricao?: string
      tipo?: string
      categoria?: string
      modelo?: string
      temperatura?: number
      ativo?: boolean
      parent_id?: string | null
      departamento?: string
      squad?: string
      contexto_operacional?: string
      max_tokens?: number
      timeout_ms?: number
    },
  ) {
    const agente = await prisma.ocAgente.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        system_prompt: data.system_prompt,
        descricao: data.descricao,
        tipo: data.tipo ?? 'worker',
        categoria: data.categoria,
        modelo: data.modelo ?? 'gpt-4o-mini',
        temperatura: data.temperatura ?? 0.7,
        ativo: data.ativo ?? true,
        parent_id: data.parent_id || null,
        departamento: data.departamento,
        squad: data.squad,
        contexto_operacional: data.contexto_operacional,
        max_tokens: data.max_tokens ?? 1024,
        timeout_ms: data.timeout_ms ?? 30000,
      },
    })
    return serializeAgente(agente)
  }

  async getAgente(organizationId: string, agenteId: string) {
    const agente = await prisma.ocAgente.findFirst({
      where: { id: agenteId, organization_id: organizationId },
    })
    if (!agente) throw new BadRequestError('Agente não encontrado')
    return serializeAgente(agente, true)
  }

  async patchAgente(
    organizationId: string,
    agenteId: string,
    data: Record<string, unknown>,
  ) {
    await this.getAgente(organizationId, agenteId)
    const agente = await prisma.ocAgente.update({
      where: { id: agenteId },
      data: {
        ...(typeof data.nome === 'string' ? { nome: data.nome } : {}),
        ...(data.descricao !== undefined
          ? { descricao: data.descricao as string | null }
          : {}),
        ...(typeof data.tipo === 'string' ? { tipo: data.tipo } : {}),
        ...(data.categoria !== undefined
          ? { categoria: data.categoria as string | null }
          : {}),
        ...(typeof data.system_prompt === 'string'
          ? { system_prompt: data.system_prompt }
          : {}),
        ...(data.contexto_operacional !== undefined
          ? { contexto_operacional: data.contexto_operacional as string | null }
          : {}),
        ...(typeof data.temperatura === 'number'
          ? { temperatura: data.temperatura }
          : {}),
        ...(typeof data.ativo === 'boolean' ? { ativo: data.ativo } : {}),
        ...(typeof data.modelo === 'string' ? { modelo: data.modelo } : {}),
        ...(data.parent_id !== undefined
          ? { parent_id: (data.parent_id as string | null) || null }
          : {}),
        ...(data.departamento !== undefined
          ? { departamento: data.departamento as string | null }
          : {}),
        ...(data.squad !== undefined ? { squad: data.squad as string | null } : {}),
      },
    })
    return serializeAgente(agente)
  }

  async deleteAgente(organizationId: string, agenteId: string) {
    await this.getAgente(organizationId, agenteId)
    await prisma.ocAgente.delete({ where: { id: agenteId } })
  }

  async listAgenteSkills(organizationId: string, agenteId: string) {
    await this.getAgente(organizationId, agenteId)
    const links = await prisma.ocAgenteSkill.findMany({
      where: { agente_id: agenteId },
      include: { skill: true },
    })
    return links
      .filter((l) => l.skill.organization_id === organizationId)
      .map((l) => serializeSkill(l.skill))
  }

  async linkSkill(organizationId: string, agenteId: string, skillId: string) {
    await this.getAgente(organizationId, agenteId)
    await this.getSkill(organizationId, skillId)
    await prisma.ocAgenteSkill.upsert({
      where: {
        agente_id_skill_id: { agente_id: agenteId, skill_id: skillId },
      },
      create: { agente_id: agenteId, skill_id: skillId },
      update: {},
    })
  }

  async unlinkSkill(organizationId: string, agenteId: string, skillId: string) {
    await this.getAgente(organizationId, agenteId)
    await prisma.ocAgenteSkill.deleteMany({
      where: { agente_id: agenteId, skill_id: skillId },
    })
  }

  // ── Skills ────────────────────────────────────────────────────────────────

  async listSkills(organizationId: string) {
    const rows = await prisma.ocSkill.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    })
    return rows.map(serializeSkill)
  }

  async createSkill(
    organizationId: string,
    data: {
      nome: string
      descricao_llm: string
      categoria?: string
      tool_id?: string
      parameters_schema?: Record<string, unknown>
      invocation_config?: Record<string, unknown>
      instrucoes_extras?: string
      timeout_ms?: number
      ativo?: boolean
    },
  ) {
    const skill = await prisma.ocSkill.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        descricao_llm: data.descricao_llm,
        categoria: data.categoria,
        tool_id: data.tool_id || null,
        parameters_schema: toInputJson(data.parameters_schema ?? {}),
        invocation_config: toInputJson(data.invocation_config ?? {}),
        instrucoes_extras: data.instrucoes_extras,
        timeout_ms: data.timeout_ms ?? 15000,
        ativo: data.ativo ?? true,
      },
    })
    return serializeSkill(skill)
  }

  async getSkill(organizationId: string, skillId: string) {
    const skill = await prisma.ocSkill.findFirst({
      where: { id: skillId, organization_id: organizationId },
    })
    if (!skill) throw new BadRequestError('Skill não encontrada')
    return serializeSkill(skill)
  }

  async patchSkill(
    organizationId: string,
    skillId: string,
    data: Record<string, unknown>,
  ) {
    await this.getSkill(organizationId, skillId)
    const skill = await prisma.ocSkill.update({
      where: { id: skillId },
      data: {
        ...(typeof data.nome === 'string' ? { nome: data.nome } : {}),
        ...(typeof data.descricao_llm === 'string'
          ? { descricao_llm: data.descricao_llm }
          : {}),
        ...(data.categoria !== undefined
          ? { categoria: data.categoria as string | null }
          : {}),
        ...(data.tool_id !== undefined
          ? { tool_id: (data.tool_id as string | null) || null }
          : {}),
        ...(data.parameters_schema !== undefined
          ? { parameters_schema: toInputJson(data.parameters_schema) }
          : {}),
        ...(data.invocation_config !== undefined
          ? { invocation_config: toInputJson(data.invocation_config) }
          : {}),
        ...(data.instrucoes_extras !== undefined
          ? { instrucoes_extras: data.instrucoes_extras as string | null }
          : {}),
        ...(typeof data.timeout_ms === 'number'
          ? { timeout_ms: data.timeout_ms }
          : {}),
        ...(typeof data.ativo === 'boolean' ? { ativo: data.ativo } : {}),
      },
    })
    return serializeSkill(skill)
  }

  async deleteSkill(organizationId: string, skillId: string) {
    await this.getSkill(organizationId, skillId)
    await prisma.ocSkill.delete({ where: { id: skillId } })
  }

  // ── Tools ─────────────────────────────────────────────────────────────────

  async listTools(organizationId: string) {
    const rows = await prisma.ocTool.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    })
    return rows.map(serializeTool)
  }

  async createTool(
    organizationId: string,
    data: {
      nome: string
      tipo: string
      descricao?: string
      config?: Record<string, unknown>
    },
  ) {
    const tool = await prisma.ocTool.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao,
        config: toInputJson(data.config ?? {}),
      },
    })
    return serializeTool(tool)
  }

  async getTool(organizationId: string, toolId: string) {
    const tool = await prisma.ocTool.findFirst({
      where: { id: toolId, organization_id: organizationId },
    })
    if (!tool) throw new BadRequestError('Tool não encontrada')
    return serializeTool(tool)
  }

  async patchTool(
    organizationId: string,
    toolId: string,
    data: Record<string, unknown>,
  ) {
    await this.getTool(organizationId, toolId)
    const tool = await prisma.ocTool.update({
      where: { id: toolId },
      data: {
        ...(typeof data.nome === 'string' ? { nome: data.nome } : {}),
        ...(typeof data.tipo === 'string' ? { tipo: data.tipo } : {}),
        ...(data.descricao !== undefined
          ? { descricao: data.descricao as string | null }
          : {}),
        ...(data.config !== undefined
          ? { config: toInputJson(data.config) }
          : {}),
      },
    })
    return serializeTool(tool)
  }

  async deleteTool(organizationId: string, toolId: string) {
    await this.getTool(organizationId, toolId)
    await prisma.ocTool.delete({ where: { id: toolId } })
  }

  // ── Pipelines ─────────────────────────────────────────────────────────────

  async listPipelines(organizationId: string) {
    const rows = await prisma.ocPipeline.findMany({
      where: { organization_id: organizationId },
      include: {
        _count: { select: { stages: true, cards: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    return rows.map((p) =>
      serializePipeline(p, {
        stages_count: p._count.stages,
        cards_count: p._count.cards,
      }),
    )
  }

  async createPipeline(organizationId: string, nome: string) {
    const pipeline = await prisma.ocPipeline.create({
      data: { organization_id: organizationId, nome },
    })
    return serializePipeline(pipeline, { stages_count: 0, cards_count: 0 })
  }

  async getPipeline(organizationId: string, pipelineId: string) {
    const pipeline = await prisma.ocPipeline.findFirst({
      where: { id: pipelineId, organization_id: organizationId },
      include: { _count: { select: { stages: true, cards: true } } },
    })
    if (!pipeline) throw new BadRequestError('Pipeline não encontrado')
    return serializePipeline(pipeline, {
      stages_count: pipeline._count.stages,
      cards_count: pipeline._count.cards,
    })
  }

  async deletePipeline(organizationId: string, pipelineId: string) {
    await this.getPipeline(organizationId, pipelineId)
    await prisma.ocPipeline.delete({ where: { id: pipelineId } })
  }

  async listStages(organizationId: string, pipelineId: string) {
    await this.getPipeline(organizationId, pipelineId)
    const rows = await prisma.ocPipelineStage.findMany({
      where: { pipeline_id: pipelineId },
      orderBy: { ordem: 'asc' },
    })
    return rows.map(serializeStage)
  }

  async createStage(
    organizationId: string,
    pipelineId: string,
    data: { nome: string; tipo: string; cor: string; ordem: number },
  ) {
    await this.getPipeline(organizationId, pipelineId)
    const stage = await prisma.ocPipelineStage.create({
      data: {
        pipeline_id: pipelineId,
        nome: data.nome,
        tipo: data.tipo,
        cor: data.cor,
        ordem: data.ordem,
      },
    })
    return serializeStage(stage)
  }

  async listCards(organizationId: string, pipelineId: string) {
    await this.getPipeline(organizationId, pipelineId)
    const rows = await prisma.ocPipelineCard.findMany({
      where: { pipeline_id: pipelineId, organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    })
    return rows.map(serializeCard)
  }

  async createCard(
    organizationId: string,
    pipelineId: string,
    data: {
      stage_id: string
      conversa_id?: string
      titulo?: string
      valor_estimado?: number
    },
  ) {
    await this.getPipeline(organizationId, pipelineId)
    const card = await prisma.ocPipelineCard.create({
      data: {
        organization_id: organizationId,
        pipeline_id: pipelineId,
        stage_id: data.stage_id,
        conversa_id: data.conversa_id,
        titulo: data.titulo,
        valor_estimado:
          data.valor_estimado != null
            ? new Prisma.Decimal(data.valor_estimado)
            : undefined,
      },
    })
    return serializeCard(card)
  }

  async patchCard(
    organizationId: string,
    cardId: string,
    data: Record<string, unknown>,
  ) {
    const existing = await prisma.ocPipelineCard.findFirst({
      where: { id: cardId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Card não encontrado')

    const card = await prisma.ocPipelineCard.update({
      where: { id: cardId },
      data: {
        ...(typeof data.stage_id === 'string' ? { stage_id: data.stage_id } : {}),
        ...(typeof data.pipeline_id === 'string'
          ? { pipeline_id: data.pipeline_id }
          : {}),
        ...(data.conversa_id !== undefined
          ? { conversa_id: data.conversa_id as string | null }
          : {}),
        ...(data.titulo !== undefined
          ? { titulo: data.titulo as string | null }
          : {}),
        ...(data.valor_estimado !== undefined
          ? {
              valor_estimado:
                data.valor_estimado == null
                  ? null
                  : new Prisma.Decimal(Number(data.valor_estimado)),
            }
          : {}),
        ...(typeof data.won === 'boolean' ? { won: data.won } : {}),
        ...(typeof data.lost === 'boolean' ? { lost: data.lost } : {}),
      },
    })
    return serializeCard(card)
  }

  async deleteCard(organizationId: string, cardId: string) {
    const existing = await prisma.ocPipelineCard.findFirst({
      where: { id: cardId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Card não encontrado')
    await prisma.ocPipelineCard.delete({ where: { id: cardId } })
  }

  // ── Inboxes ───────────────────────────────────────────────────────────────

  async listInboxes(organizationId: string) {
    const rows = await prisma.ocInbox.findMany({
      where: { organization_id: organizationId },
      orderBy: [{ ordem: 'asc' }, { created_at: 'asc' }],
    })
    return rows.map(serializeInbox)
  }

  async createInbox(
    organizationId: string,
    data: {
      nome: string
      icone?: string
      cor?: string
      filtros?: Record<string, unknown>
    },
  ) {
    const max = await prisma.ocInbox.findFirst({
      where: { organization_id: organizationId },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    })
    const inbox = await prisma.ocInbox.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        icone: data.icone ?? 'inbox',
        cor: data.cor ?? 'gray',
        filtros: toInputJson(data.filtros ?? {}),
        ordem: (max?.ordem ?? 0) + 1,
      },
    })
    return serializeInbox(inbox)
  }

  async patchInbox(
    organizationId: string,
    inboxId: string,
    data: {
      nome?: string
      icone?: string
      cor?: string
      filtros?: Record<string, unknown>
    },
  ) {
    const existing = await prisma.ocInbox.findFirst({
      where: { id: inboxId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Inbox não encontrada')
    const inbox = await prisma.ocInbox.update({
      where: { id: inboxId },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.icone !== undefined ? { icone: data.icone } : {}),
        ...(data.cor !== undefined ? { cor: data.cor } : {}),
        ...(data.filtros !== undefined
          ? { filtros: toInputJson(data.filtros) }
          : {}),
      },
    })
    return serializeInbox(inbox)
  }

  async deleteInbox(organizationId: string, inboxId: string) {
    const existing = await prisma.ocInbox.findFirst({
      where: { id: inboxId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Inbox não encontrada')
    await prisma.ocInbox.delete({ where: { id: inboxId } })
  }

  // ── Automações ────────────────────────────────────────────────────────────

  async listAutomacoes(organizationId: string) {
    const rows = await prisma.ocAutomacao.findMany({
      where: { organization_id: organizationId },
      orderBy: { created_at: 'desc' },
    })
    return rows.map(serializeAutomacao)
  }

  async createAutomacao(
    organizationId: string,
    data: {
      nome: string
      trigger_tipo: string
      descricao?: string
      condicoes?: Record<string, unknown>[]
      acoes?: Record<string, unknown>[]
      limite_rpm?: number
      ativa?: boolean
    },
  ) {
    const row = await prisma.ocAutomacao.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        trigger_tipo: data.trigger_tipo,
        descricao: data.descricao,
        condicoes: toInputJson(data.condicoes ?? []),
        acoes: toInputJson(data.acoes ?? []),
        limite_rpm: data.limite_rpm ?? 10,
        ativa: data.ativa ?? true,
      },
    })
    return serializeAutomacao(row)
  }

  async patchAutomacao(
    organizationId: string,
    automacaoId: string,
    data: Record<string, unknown>,
  ) {
    const existing = await prisma.ocAutomacao.findFirst({
      where: { id: automacaoId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Automação não encontrada')
    const row = await prisma.ocAutomacao.update({
      where: { id: automacaoId },
      data: {
        ...(typeof data.nome === 'string' ? { nome: data.nome } : {}),
        ...(data.descricao !== undefined
          ? { descricao: data.descricao as string | null }
          : {}),
        ...(typeof data.trigger_tipo === 'string'
          ? { trigger_tipo: data.trigger_tipo }
          : {}),
        ...(typeof data.ativa === 'boolean' ? { ativa: data.ativa } : {}),
        ...(data.condicoes !== undefined
          ? { condicoes: toInputJson(data.condicoes) }
          : {}),
        ...(data.acoes !== undefined ? { acoes: toInputJson(data.acoes) } : {}),
        ...(typeof data.limite_rpm === 'number'
          ? { limite_rpm: data.limite_rpm }
          : {}),
      },
    })
    return serializeAutomacao(row)
  }

  async deleteAutomacao(organizationId: string, automacaoId: string) {
    const existing = await prisma.ocAutomacao.findFirst({
      where: { id: automacaoId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Automação não encontrada')
    await prisma.ocAutomacao.delete({ where: { id: automacaoId } })
  }

  async executarAutomacao(
    organizationId: string,
    conversaId: string,
    automacaoId: string,
  ) {
    await this.getConversa(organizationId, conversaId)
    const automacao = await prisma.ocAutomacao.findFirst({
      where: { id: automacaoId, organization_id: organizationId },
    })
    if (!automacao) throw new BadRequestError('Automação não encontrada')
    await enqueueRunAutomation({
      organizationId,
      automacaoId,
      conversaId,
    })
    return { ok: true, resultados: [] as { ok?: boolean; erro?: string; tipo?: string }[] }
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  async listTags(organizationId: string) {
    const rows = await prisma.ocTag.findMany({
      where: { organization_id: organizationId },
      orderBy: { nome: 'asc' },
    })
    return rows.map(serializeTag)
  }

  async createTag(organizationId: string, data: { nome: string; cor: string }) {
    const tag = await prisma.ocTag.create({
      data: {
        organization_id: organizationId,
        nome: data.nome,
        cor: data.cor,
      },
    })
    return serializeTag(tag)
  }

  async patchTag(
    organizationId: string,
    tagId: string,
    data: { nome?: string; cor?: string },
  ) {
    const existing = await prisma.ocTag.findFirst({
      where: { id: tagId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Tag não encontrada')
    const tag = await prisma.ocTag.update({
      where: { id: tagId },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.cor !== undefined ? { cor: data.cor } : {}),
      },
    })
    return serializeTag(tag)
  }

  async deleteTag(organizationId: string, tagId: string) {
    const existing = await prisma.ocTag.findFirst({
      where: { id: tagId, organization_id: organizationId },
    })
    if (!existing) throw new BadRequestError('Tag não encontrada')
    await prisma.ocTag.delete({ where: { id: tagId } })
  }

  // ── Config IA ─────────────────────────────────────────────────────────────

  async getOrCreateConfigIA(organizationId: string) {
    let cfg = await prisma.ocConfigIA.findUnique({
      where: { organization_id: organizationId },
    })
    if (!cfg) {
      cfg = await prisma.ocConfigIA.create({
        data: { organization_id: organizationId },
      })
    }
    return serializeConfigIA(cfg)
  }

  async patchConfigIA(organizationId: string, data: Record<string, unknown>) {
    await this.getOrCreateConfigIA(organizationId)
    const cfg = await prisma.ocConfigIA.update({
      where: { organization_id: organizationId },
      data: {
        ...(typeof data.ia_habilitada === 'boolean'
          ? { ia_habilitada: data.ia_habilitada }
          : {}),
        ...(typeof data.pausar_ia_humano_responde === 'boolean'
          ? { pausar_ia_humano_responde: data.pausar_ia_humano_responde }
          : {}),
        ...(typeof data.atendimento_24h === 'boolean'
          ? { atendimento_24h: data.atendimento_24h }
          : {}),
        ...(data.horario_config !== undefined
          ? { horario_config: toInputJson(data.horario_config) }
          : {}),
        ...(data.mensagem_fora_horario !== undefined
          ? { mensagem_fora_horario: data.mensagem_fora_horario as string | null }
          : {}),
        ...(data.contexto_negocio !== undefined
          ? { contexto_negocio: data.contexto_negocio as string | null }
          : {}),
        ...(data.limite_tokens_mes !== undefined
          ? { limite_tokens_mes: data.limite_tokens_mes as number | null }
          : {}),
        ...(Array.isArray(data.dominios_permitidos)
          ? { dominios_permitidos: data.dominios_permitidos.map(String) }
          : {}),
        ...(data.handoff_keywords !== undefined
          ? { handoff_keywords: toInputJson(data.handoff_keywords) }
          : {}),
        ...(typeof data.resumo_modelo === 'string'
          ? { resumo_modelo: data.resumo_modelo }
          : {}),
        ...(typeof data.timezone === 'string' ? { timezone: data.timezone } : {}),
      },
    })
    return serializeConfigIA(cfg)
  }

  // ── Watchdog ──────────────────────────────────────────────────────────────

  async getOrCreateWatchdog(organizationId: string) {
    let cfg = await prisma.ocWatchdogConfig.findUnique({
      where: { organization_id: organizationId },
    })
    if (!cfg) {
      cfg = await prisma.ocWatchdogConfig.create({
        data: { organization_id: organizationId },
      })
    }
    const conversasPresas = await prisma.ocConversa.count({
      where: { organization_id: organizationId, is_stuck: true },
    })
    return {
      config: serializeWatchdog(cfg),
      conversas_presas: conversasPresas,
      timers_ativos: 0,
      checks_24h: 0,
      reativacoes_24h: 0,
    }
  }

  async patchWatchdog(organizationId: string, data: Record<string, unknown>) {
    await this.getOrCreateWatchdog(organizationId)
    const cfg = await prisma.ocWatchdogConfig.update({
      where: { organization_id: organizationId },
      data: {
        ...(typeof data.habilitado === 'boolean'
          ? { habilitado: data.habilitado }
          : {}),
        ...(typeof data.threshold_bot_min === 'number'
          ? { threshold_bot_min: data.threshold_bot_min }
          : {}),
        ...(typeof data.threshold_pending_min === 'number'
          ? { threshold_pending_min: data.threshold_pending_min }
          : {}),
        ...(typeof data.threshold_open_min === 'number'
          ? { threshold_open_min: data.threshold_open_min }
          : {}),
        ...(typeof data.max_tentativas === 'number'
          ? { max_tentativas: data.max_tentativas }
          : {}),
        ...(typeof data.horario_24h === 'boolean'
          ? { horario_24h: data.horario_24h }
          : {}),
      },
    })
    return serializeWatchdog(cfg)
  }

  async listAlertas(organizationId: string) {
    const rows = await prisma.ocConversa.findMany({
      where: {
        organization_id: organizationId,
        stuck_attempts: { gt: 0 },
      },
      orderBy: { last_message_at: 'desc' },
      take: 100,
      include: { contato: true },
    })
    return rows.map((c) => ({
      conversa_id: c.id,
      status: c.status,
      stuck_attempts: c.stuck_attempts,
      is_stuck: c.is_stuck,
      contato_nome: c.contato?.nome ?? null,
      last_message_at: c.last_message_at?.toISOString() ?? null,
    }))
  }

  // ── Dashboard / Jarvis / Execuções ────────────────────────────────────────

  async getDashboard(organizationId: string, periodo = '30d') {
    const days = periodo.endsWith('d') ? Number(periodo.replace('d', '')) || 30 : 30
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [total, canais] = await Promise.all([
      prisma.ocConversa.findMany({
        where: {
          organization_id: organizationId,
          created_at: { gte: since },
        },
      }),
      prisma.ocCanal.findMany({
        where: { organization_id: organizationId },
        select: { id: true, nome: true },
      }),
    ])

    const canaisMap = new Map(canais.map((c) => [c.id, c.nome]))
    const fechadas = total.filter((c) => c.status === 'closed')
    const ativas = total.filter((c) => c.status !== 'closed')
    const presas = total.filter((c) => c.is_stuck)

    const tempos = total
      .filter((c) => c.first_response_at)
      .map(
        (c) =>
          (c.first_response_at!.getTime() - c.created_at.getTime()) / 60000,
      )
    const tempoAvg = tempos.length
      ? tempos.reduce((a, b) => a + b, 0) / tempos.length
      : 0

    const porStatus: Record<string, number> = {}
    const porCanalCount = new Map<string, number>()
    const serieCounter = new Map<string, number>()
    const heatmap: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0),
    )

    for (const c of total) {
      porStatus[c.status] = (porStatus[c.status] ?? 0) + 1
      porCanalCount.set(c.canal_id, (porCanalCount.get(c.canal_id) ?? 0) + 1)
      const key = c.created_at.toISOString().slice(0, 10)
      serieCounter.set(key, (serieCounter.get(key) ?? 0) + 1)
      const day = c.created_at.getUTCDay()
      const hour = c.created_at.getUTCHours()
      const row = heatmap[day]
      if (row) row[hour] = (row[hour] ?? 0) + 1
    }

    const porCanal = [...porCanalCount.entries()].map(([canal_id, count]) => ({
      canal_id,
      nome: canaisMap.get(canal_id) ?? 'Canal',
      total: count,
    }))

    const serieDiaria: { data: string; total: number }[] = []
    const cursor = new Date(since)
    const end = new Date()
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10)
      serieDiaria.push({ data: key, total: serieCounter.get(key) ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    return {
      conversas_ativas: ativas.length,
      conversas_presas: presas.length,
      total_conversas: total.length,
      conversas_fechadas: fechadas.length,
      taxa_resolucao_pct: Number(
        ((fechadas.length / Math.max(total.length, 1)) * 100).toFixed(1),
      ),
      tempo_primeira_resposta_avg: Number(tempoAvg.toFixed(1)),
      fcr_pct: 100,
      taxa_reabertura_pct: 0,
      csat_avg: null,
      periodo_dias: days,
      por_status: porStatus,
      por_canal: porCanal,
      serie_diaria: serieDiaria,
      heatmap,
    }
  }

  async getJarvisOverview(organizationId: string, periodo = '7d') {
    const since = new Date()
    if (periodo === '24h') since.setHours(since.getHours() - 24)
    else if (periodo === '30d') since.setDate(since.getDate() - 30)
    else since.setDate(since.getDate() - 7)

    const runs = await prisma.ocExecucao.findMany({
      where: {
        organization_id: organizationId,
        started_at: { gte: since },
      },
      include: { agente: true, skill: true },
      orderBy: { started_at: 'desc' },
    })

    const porStatus: Record<string, number> = {}
    let tokensTotal = 0
    let runsOk = 0
    let runsFalhas = 0

    for (const r of runs) {
      porStatus[r.status] = (porStatus[r.status] ?? 0) + 1
      tokensTotal += (r.tokens_input ?? 0) + (r.tokens_output ?? 0)
      if (r.status === 'success') runsOk += 1
      if (r.status === 'error' || r.status === 'timeout') runsFalhas += 1
    }

    return {
      periodo,
      custo_usd: 0,
      custo_por_run_usd: 0,
      tokens_total: tokensTotal,
      cache_hits: 0,
      runs_total: runs.length,
      runs_ok: runsOk,
      runs_falhas: runsFalhas,
      taxa_sucesso_pct:
        runs.length > 0
          ? Number(((runsOk / runs.length) * 100).toFixed(1))
          : null,
      latencia_p50_ms: null,
      latencia_p95_ms: null,
      por_modelo: [] as { modelo: string; custo_usd: number; runs: number; tokens: number }[],
      por_agente: [] as {
        agente_id: string
        nome: string
        runs: number
        custo_usd: number
        tokens: number
      }[],
      tools_chamadas: [] as { skill_id: string; nome: string; chamadas: number }[],
      por_status: porStatus,
      delegacoes: [] as {
        de_agente_id?: string
        para_agente_id?: string
        started_at: string
      }[],
      ultimas_execucoes: runs.slice(0, 20).map((r) => ({
        id: r.id,
        status: r.status,
        agente_nome: r.agente?.nome,
        modelo: r.agente?.modelo,
        duration_ms: r.duration_ms ?? undefined,
        tokens_input: r.tokens_input ?? undefined,
        tokens_output: r.tokens_output ?? undefined,
        error_msg: r.error_msg ?? undefined,
        started_at: r.started_at.toISOString(),
      })),
    }
  }

  async listExecucoes(
    organizationId: string,
    opts?: { dias?: number; status?: string; so_erros?: boolean },
  ) {
    const dias = opts?.dias ?? 7
    const since = new Date()
    since.setDate(since.getDate() - dias)

    const rows = await prisma.ocExecucao.findMany({
      where: {
        organization_id: organizationId,
        started_at: { gte: since },
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.so_erros
          ? { status: { in: ['error', 'timeout'] } }
          : {}),
      },
      orderBy: { started_at: 'desc' },
      take: 200,
    })
    return rows.map(serializeExecucao)
  }

  // ── Provision / LLM ───────────────────────────────────────────────────────

  async provisionIaDefaults(organizationId: string, force = false) {
    const details: string[] = []
    const existingAgentes = await prisma.ocAgente.count({
      where: { organization_id: organizationId },
    })
    const existingPipelines = await prisma.ocPipeline.count({
      where: { organization_id: organizationId },
    })

    if (existingAgentes > 0 && existingPipelines > 0 && !force) {
      const jarvis = await prisma.ocAgente.findFirst({
        where: { organization_id: organizationId, tipo: 'orchestrator' },
      })
      const pipeline = await prisma.ocPipeline.findFirst({
        where: { organization_id: organizationId },
        orderBy: { created_at: 'asc' },
      })
      return {
        created_tools: 0,
        created_skills: 0,
        created_agentes: 0,
        linked_skills: 0,
        created_automacoes: 0,
        canais_atualizados: 0,
        already_seeded: true,
        jarvis_id: jarvis?.id,
        pipeline_id: pipeline?.id,
        details: ['Stack IA já provisionada'],
      }
    }

    let createdAgentes = 0
    let createdPipelines = 0
    let jarvisId: string | undefined
    let pipelineId: string | undefined

    if (existingAgentes === 0 || force) {
      const jarvis = await prisma.ocAgente.create({
        data: {
          organization_id: organizationId,
          nome: 'Jarvis',
          tipo: 'orchestrator',
          categoria: 'orquestrador',
          modelo: 'gpt-4o-mini',
          system_prompt:
            'Você é o orquestrador de atendimento omnichannel. Direcione conversas e acione skills quando necessário.',
          ativo: true,
        },
      })
      jarvisId = jarvis.id
      createdAgentes += 1
      details.push('Agente Jarvis criado')
    } else {
      const jarvis = await prisma.ocAgente.findFirst({
        where: { organization_id: organizationId, tipo: 'orchestrator' },
      })
      jarvisId = jarvis?.id
    }

    if (existingPipelines === 0 || force) {
      const pipeline = await prisma.ocPipeline.create({
        data: {
          organization_id: organizationId,
          nome: 'Funil padrão',
          stages: {
            create: [
              { nome: 'Novo', tipo: 'normal', cor: 'blue', ordem: 0 },
              { nome: 'Em atendimento', tipo: 'normal', cor: 'amber', ordem: 1 },
              { nome: 'Ganho', tipo: 'ganho', cor: 'green', ordem: 2 },
            ],
          },
        },
      })
      pipelineId = pipeline.id
      createdPipelines += 1
      details.push('Pipeline padrão com 3 stages criado')
    } else {
      const pipeline = await prisma.ocPipeline.findFirst({
        where: { organization_id: organizationId },
        orderBy: { created_at: 'asc' },
      })
      pipelineId = pipeline?.id
    }

    return {
      created_tools: 0,
      created_skills: 0,
      created_agentes: createdAgentes,
      linked_skills: 0,
      created_automacoes: 0,
      canais_atualizados: 0,
      already_seeded: false,
      jarvis_id: jarvisId,
      pipeline_id: pipelineId,
      details: details.length
        ? details
        : [`Pipelines criados: ${createdPipelines}`],
    }
  }

  listLlmProviders() {
    return {
      providers: [
        {
          id: 'openai',
          name: 'openai',
          label: 'OpenAI (GPT)',
          configured: false,
          models: ['gpt-4o-mini', 'gpt-4o'],
        },
      ],
    }
  }
}

export const omnichannelService = new OmnichannelService()
