import { prisma } from '@/lib/prisma'
import { toInputJson } from '@/services/omnichannel/oc-serialize'
import { evolutionSendText } from '@/services/omnichannel/evolution-client'
import { sendOutboundEmail } from '@/services/omnichannel/email-outbound'
import type { OutboundSendJobData } from '../queue/queues'

export async function processOutboundSend(
  data: OutboundSendJobData,
): Promise<{ ok: boolean }> {
  const channel = data.channel || 'whatsapp'

  if (channel === 'email') {
    if (!data.email) {
      throw new Error(`E-mail destino ausente mensagem=${data.mensagemId}`)
    }
    const result = await sendOutboundEmail({
      to: data.email,
      subject: data.subject || 'Resposta do seu atendimento',
      text: data.texto,
    })
    if (!result.ok) {
      throw new Error(
        `Falha ao enviar e-mail mensagem=${data.mensagemId}: ${result.error}`,
      )
    }
    await markMensagemExtra(data, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      reply_via: 'email',
      reply_to: data.email,
    })
    return { ok: true }
  }

  if (!data.instanceName || !data.phone) {
    throw new Error(
      `WhatsApp incompleto mensagem=${data.mensagemId} instance=${data.instanceName}`,
    )
  }

  const sent = await evolutionSendText(
    data.instanceName,
    data.phone,
    data.texto,
    data.instanceToken,
  )

  if (!sent) {
    throw new Error(
      `Falha ao enviar WhatsApp mensagem=${data.mensagemId} instance=${data.instanceName}`,
    )
  }

  await markMensagemExtra(data, {
    evolution_sent: true,
    evolution_sent_at: new Date().toISOString(),
    reply_via: 'whatsapp',
    reply_to: data.phone,
  })

  return { ok: true }
}

async function markMensagemExtra(
  data: OutboundSendJobData,
  patch: Record<string, unknown>,
) {
  const msg = await prisma.ocMensagem.findFirst({
    where: { id: data.mensagemId, organization_id: data.organizationId },
  })
  if (!msg) return
  const extra =
    msg.extra_data && typeof msg.extra_data === 'object' && !Array.isArray(msg.extra_data)
      ? (msg.extra_data as Record<string, unknown>)
      : {}
  await prisma.ocMensagem.update({
    where: { id: msg.id },
    data: {
      extra_data: toInputJson({
        ...extra,
        ...patch,
      }),
    },
  })
}
