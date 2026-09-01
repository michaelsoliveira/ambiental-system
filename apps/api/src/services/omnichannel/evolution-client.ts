/**
 * Cliente HTTP da Evolution API (WhatsApp Baileys).
 * Configuração via .env: EVOLUTION_API_BASE_URL + EVOLUTION_API_GLOBAL_KEY.
 */

const TIMEOUT_MS = 20_000

export type EvolutionConfig = {
  baseUrl: string
  globalKey: string
  webhookPublicUrl: string
  webhookSecret?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function getEvolutionConfig(): EvolutionConfig | null {
  const baseUrl = (process.env.EVOLUTION_API_BASE_URL || '').trim().replace(/\/$/, '')
  const globalKey = (process.env.EVOLUTION_API_GLOBAL_KEY || '').trim()
  if (!baseUrl || !globalKey) return null

  const webhookPublicUrl = (
    process.env.EVOLUTION_WEBHOOK_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333'
  )
    .trim()
    .replace(/\/$/, '')

  return {
    baseUrl,
    globalKey,
    webhookPublicUrl,
    webhookSecret: process.env.EVOLUTION_WEBHOOK_SECRET?.trim() || undefined,
  }
}

export function isEvolutionConfigured(): boolean {
  return getEvolutionConfig() !== null
}

export function evolutionWebhookUrl(): string {
  const cfg = getEvolutionConfig()
  const base = (
    cfg?.webhookPublicUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333'
  ).replace(/\/$/, '')
  return `${normalizeCallbackBase(base)}/webhooks/evolution`
}

/** Converte localhost → host.docker.internal quando a Evolution roda em Docker. */
function normalizeCallbackBase(rawBase: string): string {
  try {
    const url = new URL(rawBase.startsWith('http') ? rawBase : `http://${rawBase}`)
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1') {
      url.hostname = 'host.docker.internal'
      return url.toString().replace(/\/$/, '')
    }
    return rawBase.replace(/\/$/, '')
  } catch {
    return rawBase.replace(/\/$/, '')
  }
}

function headers(apiKey?: string): Record<string, string> {
  const cfg = getEvolutionConfig()
  const key = apiKey || cfg?.globalKey || ''
  return { 'Content-Type': 'application/json', apikey: key }
}

async function evoFetch(
  path: string,
  init?: RequestInit & { apiKey?: string },
): Promise<Response> {
  const cfg = getEvolutionConfig()
  if (!cfg) {
    throw new Error(
      'Evolution API não configurada. Defina EVOLUTION_API_BASE_URL e EVOLUTION_API_GLOBAL_KEY no .env.',
    )
  }
  const { apiKey, ...rest } = init ?? {}
  return fetch(`${cfg.baseUrl}${path}`, {
    ...rest,
    headers: {
      ...headers(apiKey),
      ...(rest.headers as Record<string, string> | undefined),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
}

export function normalizeWhatsappStatus(raw: string | undefined | null): string {
  if (!raw) return 'disconnected'
  if (raw === 'open' || raw === 'connected') return raw
  if (raw === 'close' || raw === 'closed' || raw === 'disconnected') return 'disconnected'
  return raw
}

export function formatPhoneBr(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length < 10) return digits
  if (d.startsWith('55') && d.length >= 12) {
    const country = d.slice(0, 2)
    const ddd = d.slice(2, 4)
    const rest = d.slice(4)
    if (rest.length === 9) return `+${country} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    if (rest.length === 8) return `+${country} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }
  if (d.length === 11 && !d.startsWith('55')) {
    return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }
  if (d.length === 10) {
    return `+55 (${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return digits
}

/**
 * Normaliza telefone para a Evolution (E.164 sem +).
 * BR com 10/11 dígitos (DDD+número) → prefixa 55.
 */
export function toWhatsappNumber(phone: string): string {
  let d = phone.replace(/\D/g, '')
  if (!d) return ''
  // remove zeros à esquerda (ex.: 096...)
  d = d.replace(/^0+/, '')
  if ((d.length === 10 || d.length === 11) && !d.startsWith('55')) {
    d = `55${d}`
  }
  return d
}

export async function evolutionCreateInstance(
  instanceName: string,
  webhookUrl?: string,
): Promise<{ exists?: boolean; raw: unknown }> {
  const resp = await evoFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      groupsIgnore: true,
    }),
  })

  if (resp.status === 403) {
    return { exists: true, raw: await resp.json().catch(() => ({})) }
  }
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Erro ao criar instância Evolution: ${resp.status} — ${text.slice(0, 300)}`)
  }
  const raw = await resp.json().catch(() => ({}))

  if (webhookUrl) {
    try {
      await evolutionSetWebhook(instanceName, webhookUrl)
    } catch (err) {
      console.warn('[evolution] webhook não configurado:', err)
    }
  }

  return { raw }
}

export async function evolutionDeleteInstance(instanceName: string): Promise<boolean> {
  try {
    const resp = await evoFetch(`/instance/delete/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
    })
    return resp.ok || resp.status === 404
  } catch {
    return false
  }
}

export async function evolutionSetWebhook(
  instanceName: string,
  webhookUrl: string,
): Promise<void> {
  // byEvents=false → POST direto em /webhooks/evolution (mais simples e confiável).
  // Mantemos também a rota /webhooks/evolution/:eventSlug para instâncias antigas.
  const resp = await evoFetch(`/webhook/set/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    }),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Webhook Evolution falhou: ${resp.status} — ${text.slice(0, 200)}`)
  }
}

export async function evolutionConnectInstance(
  instanceName: string,
): Promise<Record<string, unknown>> {
  const resp = await evoFetch(`/instance/connect/${encodeURIComponent(instanceName)}`)
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new Error(
      `Erro ao obter QR Evolution: ${resp.status} — ${JSON.stringify(data).slice(0, 300)}`,
    )
  }
  return asRecord(data)
}

export async function evolutionFetchStatus(instanceName: string): Promise<string> {
  try {
    const resp = await evoFetch(
      `/instance/connectionState/${encodeURIComponent(instanceName)}`,
    )
    if (resp.ok) {
      const data = asRecord(await resp.json().catch(() => ({})))
      const instance = asRecord(data.instance)
      const state =
        (typeof data.connectionStatus === 'string' && data.connectionStatus) ||
        (typeof data.state === 'string' && data.state) ||
        (typeof instance.state === 'string' && instance.state) ||
        (typeof instance.connectionStatus === 'string' && instance.connectionStatus) ||
        null
      if (state) return normalizeWhatsappStatus(state)
    }

    const listResp = await evoFetch('/instance/fetchInstances')
    if (listResp.ok) {
      const items = await listResp.json().catch(() => [])
      if (Array.isArray(items)) {
        for (const item of items) {
          const row = asRecord(item)
          const name =
            (typeof row.name === 'string' && row.name) ||
            (typeof row.instanceName === 'string' && row.instanceName) ||
            null
          if (name === instanceName) {
            const status =
              (typeof row.connectionStatus === 'string' && row.connectionStatus) ||
              (typeof row.status === 'string' && row.status) ||
              'unknown'
            return normalizeWhatsappStatus(status)
          }
        }
      }
    }
  } catch (err) {
    console.warn('[evolution] fetchStatus falhou:', err)
  }
  return 'unknown'
}

export async function evolutionFetchOwner(
  instanceName: string,
): Promise<string | null> {
  try {
    const resp = await evoFetch('/instance/fetchInstances')
    if (!resp.ok) return null
    const items = await resp.json().catch(() => [])
    if (!Array.isArray(items)) return null
    for (const item of items) {
      const row = asRecord(item)
      const nested = asRecord(row.instance)
      const name =
        (typeof row.name === 'string' && row.name) ||
        (typeof row.instanceName === 'string' && row.instanceName) ||
        (typeof nested.instanceName === 'string' && nested.instanceName) ||
        (typeof nested.name === 'string' && nested.name) ||
        null
      if (name !== instanceName) continue
      const owner =
        (typeof row.ownerJid === 'string' && row.ownerJid) ||
        (typeof row.owner === 'string' && row.owner) ||
        (typeof nested.owner === 'string' && nested.owner) ||
        ''
      if (owner) return owner.includes('@') ? owner.split('@')[0]! : owner
      const number = row.number ?? nested.number
      if (number) return String(number).split('@')[0]!
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Foto de perfil WhatsApp via Evolution POST /chat/fetchProfilePictureUrl/{instance}.
 */
export async function evolutionFetchProfilePictureUrl(
  instanceName: string,
  phone: string,
  instanceToken?: string | null,
): Promise<string | null> {
  const cfg = getEvolutionConfig()
  if (!cfg) return null
  const digits = toWhatsappNumber(phone)
  if (!digits) return null

  const candidates = [instanceToken, cfg.globalKey].filter(
    (t): t is string => Boolean(t && t.trim()),
  )
  if (candidates.length === 0) candidates.push('')

  const url = `${cfg.baseUrl}/chat/fetchProfilePictureUrl/${encodeURIComponent(instanceName)}`

  for (const token of [...new Set(candidates)]) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({ number: digits }),
        signal: AbortSignal.timeout(12_000),
      })
      if (resp.status === 401 && token !== cfg.globalKey) continue
      if (!resp.ok) continue
      const data = asRecord(await resp.json().catch(() => ({})))
      const nested = asRecord(data.data)
      const picture =
        (typeof data.profilePictureUrl === 'string' && data.profilePictureUrl) ||
        (typeof data.profilePicture === 'string' && data.profilePicture) ||
        (typeof nested.profilePictureUrl === 'string' &&
          nested.profilePictureUrl) ||
        (typeof nested.profilePicture === 'string' && nested.profilePicture) ||
        null
      if (picture?.trim()) return picture.trim()
    } catch (err) {
      console.warn('[evolution] fetchProfilePictureUrl falhou:', err)
    }
  }
  return null
}

export function extractQrFromConnectResponse(data: Record<string, unknown>): {
  qrcode: string | null
  pairing_code: string | null
  already_connected: boolean
} {
  const nested = asRecord(data.qrcode)
  const instance = asRecord(data.instance)
  const alreadyConnected =
    !data.base64 &&
    !data.code &&
    !data.qrcode &&
    (instance.state === 'open' ||
      data.state === 'open' ||
      data.connectionStatus === 'open')

  let qrcode: string | null =
    (typeof data.base64 === 'string' && data.base64) ||
    (typeof nested.base64 === 'string' && nested.base64) ||
    (typeof nested.code === 'string' && nested.code) ||
    (typeof data.code === 'string' && data.code) ||
    null

  if (qrcode && !qrcode.startsWith('data:') && !qrcode.startsWith('http')) {
    qrcode = `data:image/png;base64,${qrcode}`
  }

  const pairing =
    (typeof data.pairingCode === 'string' && data.pairingCode) ||
    (typeof nested.pairingCode === 'string' && nested.pairingCode) ||
    null

  return {
    qrcode,
    pairing_code: pairing,
    already_connected: alreadyConnected,
  }
}

export async function evolutionSendText(
  instanceName: string,
  phone: string,
  message: string,
  instanceToken?: string | null,
): Promise<boolean> {
  const cfg = getEvolutionConfig()
  if (!cfg) return false

  const candidates = [instanceToken, cfg.globalKey].filter(
    (t): t is string => Boolean(t && t.trim()),
  )
  if (candidates.length === 0) candidates.push('')

  const url = `${cfg.baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`
  const payload = { number: toWhatsappNumber(phone), text: message, delay: 1000 }

  for (const token of [...new Set(candidates)]) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      })
      if (resp.status === 401 && token !== cfg.globalKey) continue
      if (!resp.ok) {
        const text = await resp.text()
        console.error('[evolution] sendText falhou:', resp.status, text.slice(0, 200))
        continue
      }
      return true
    } catch (err) {
      console.error('[evolution] sendText erro:', err)
    }
  }
  return false
}

/** Envia imagem / vídeo / documento / áudio via Evolution sendMedia. */
export async function evolutionSendMedia(
  instanceName: string,
  phone: string,
  opts: {
    mediaBase64: string
    mediatype: 'image' | 'video' | 'document' | 'audio'
    mimetype: string
    fileName: string
    caption?: string
    instanceToken?: string | null
  },
): Promise<boolean> {
  const cfg = getEvolutionConfig()
  if (!cfg) return false

  const candidates = [opts.instanceToken, cfg.globalKey].filter(
    (t): t is string => Boolean(t && t.trim()),
  )
  if (candidates.length === 0) candidates.push('')

  const url = `${cfg.baseUrl}/message/sendMedia/${encodeURIComponent(instanceName)}`
  const payload = {
    number: toWhatsappNumber(phone),
    mediatype: opts.mediatype,
    mimetype: opts.mimetype,
    media: opts.mediaBase64,
    fileName: opts.fileName,
    caption: opts.caption || '',
  }

  for (const token of [...new Set(candidates)]) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      })
      if (resp.status === 401 && token !== cfg.globalKey) continue
      if (!resp.ok) {
        const text = await resp.text()
        console.error('[evolution] sendMedia falhou:', resp.status, text.slice(0, 300))
        continue
      }
      return true
    } catch (err) {
      console.error('[evolution] sendMedia erro:', err)
    }
  }
  return false
}

/** Mensagem de voz (PTT) — endpoint dedicado. */
export async function evolutionSendWhatsappAudio(
  instanceName: string,
  phone: string,
  audioBase64: string,
  instanceToken?: string | null,
): Promise<boolean> {
  const cfg = getEvolutionConfig()
  if (!cfg) return false

  const candidates = [instanceToken, cfg.globalKey].filter(
    (t): t is string => Boolean(t && t.trim()),
  )
  if (candidates.length === 0) candidates.push('')

  const url = `${cfg.baseUrl}/message/sendWhatsAppAudio/${encodeURIComponent(instanceName)}`
  const payload = { number: toWhatsappNumber(phone), audio: audioBase64 }

  for (const token of [...new Set(candidates)]) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      })
      if (resp.status === 401 && token !== cfg.globalKey) continue
      if (!resp.ok) {
        const text = await resp.text()
        console.error('[evolution] sendWhatsAppAudio falhou:', resp.status, text.slice(0, 300))
        continue
      }
      return true
    } catch (err) {
      console.error('[evolution] sendWhatsAppAudio erro:', err)
    }
  }
  return false
}

/**
 * Baixa mídia de mensagem WhatsApp (inbound) via Evolution.
 * POST /chat/getBase64FromMediaMessage/{instance}
 */
export async function evolutionGetBase64FromMediaMessage(
  instanceName: string,
  messageKey: Record<string, unknown>,
  opts?: {
    convertToMp4?: boolean
    instanceToken?: string | null
  },
): Promise<{ base64: string; mimetype?: string } | null> {
  const cfg = getEvolutionConfig()
  if (!cfg) return null

  const candidates = [opts?.instanceToken, cfg.globalKey].filter(
    (t): t is string => Boolean(t && t.trim()),
  )
  if (candidates.length === 0) candidates.push('')

  const url = `${cfg.baseUrl}/chat/getBase64FromMediaMessage/${encodeURIComponent(instanceName)}`
  const payload = {
    message: { key: messageKey },
    convertToMp4: Boolean(opts?.convertToMp4),
  }

  for (const token of [...new Set(candidates)]) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      })
      if (resp.status === 401 && token !== cfg.globalKey) continue
      if (!resp.ok) continue
      const data = asRecord(await resp.json().catch(() => ({})))
      const nested = asRecord(data.data)
      const b64 =
        (typeof data.base64 === 'string' && data.base64) ||
        (typeof nested.base64 === 'string' && nested.base64) ||
        null
      if (!b64) continue
      const mimetype =
        (typeof data.mimetype === 'string' && data.mimetype) ||
        (typeof nested.mimetype === 'string' && nested.mimetype) ||
        undefined
      return { base64: b64, mimetype }
    } catch (err) {
      console.warn('[evolution] getBase64FromMediaMessage falhou:', err)
    }
  }
  return null
}

export type EvolutionIncomingMessage = {
  instance: string
  eventType: string
  remoteJid: string
  phone: string
  messageId: string
  text: string
  fromMe: boolean
  pushName: string
}

export function parseEvolutionWebhook(
  body: Record<string, unknown>,
): EvolutionIncomingMessage | null {
  const rawEvent = String(body.event || '')
  const eventType = rawEvent
    .trim()
    .toLowerCase()
    .replace(/_/g, '.')
  const instance = String(body.instance || '')
  const data = asRecord(body.data)

  if (eventType === 'connection.update') {
    return {
      instance,
      eventType,
      remoteJid: '',
      phone: '',
      messageId: '',
      text: String(asRecord(data).state || data.status || 'unknown'),
      fromMe: false,
      pushName: '',
    }
  }

  if (eventType !== 'messages.upsert') return null

  const msg = asRecord(data.message)
  const key = asRecord(data.key)
  const remoteJid = String(key.remoteJid || '')
  if (remoteJid.endsWith('@g.us')) return null

  const extended = asRecord(msg.extendedTextMessage)
  const image = asRecord(msg.imageMessage)
  const video = asRecord(msg.videoMessage)
  const document = asRecord(msg.documentMessage)

  let text =
    (typeof msg.conversation === 'string' && msg.conversation) ||
    (typeof extended.text === 'string' && extended.text) ||
    (typeof image.caption === 'string' && image.caption) ||
    (typeof video.caption === 'string' && video.caption) ||
    (typeof document.caption === 'string' && document.caption) ||
    ''

  if (!text) {
    if (msg.imageMessage) text = '[Imagem]'
    else if (msg.audioMessage || msg.pttMessage) text = '[Áudio]'
    else if (msg.videoMessage) text = '[Vídeo]'
    else if (msg.documentMessage) text = '[Documento]'
    else if (msg.stickerMessage) text = '[Figurinha]'
    else if (msg.contactMessage || msg.contactsArrayMessage) text = '[Contato]'
    else if (msg.locationMessage) text = '[Localização]'
  }

  return {
    instance,
    eventType,
    remoteJid,
    phone: remoteJid.split('@')[0] || '',
    messageId: String(key.id || ''),
    text,
    fromMe: Boolean(key.fromMe),
    pushName: String(data.pushName || '').trim(),
  }
}
