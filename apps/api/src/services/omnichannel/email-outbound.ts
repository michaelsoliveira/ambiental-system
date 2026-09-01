import { env } from '@saas/env'

export function isEmailOutboundConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY)
}

export async function sendOutboundEmail(opts: {
  to: string
  subject: string
  text: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      error: 'RESEND_API_KEY não configurada — defina no .env para enviar e-mail.',
    }
  }

  const from = env.OC_EMAIL_FROM || 'Ambiental <onboarding@resend.dev>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        ok: false,
        error: `Resend ${res.status}: ${body.slice(0, 300)}`,
      }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Falha ao enviar e-mail',
    }
  }
}
