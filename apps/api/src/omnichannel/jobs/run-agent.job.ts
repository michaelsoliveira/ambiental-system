import { prisma } from '@/lib/prisma'
import { toInputJson } from '@/services/omnichannel/oc-serialize'
import { evolutionSendText } from '@/services/omnichannel/evolution-client'
import type { RunAgentJobData } from '../queue/queues'

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

async function callOpenAi(
  model: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperatura: number,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada — oc-worker não pode gerar resposta IA')
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      temperature: temperatura ?? 0.7,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`OpenAI ${resp.status}: ${text.slice(0, 300)}`)
  }

  const json = (await resp.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = json.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('OpenAI retornou resposta vazia')
  return content
}

/**
 * Executa o agente IA em uma conversa (equivalente ao agent_runner Celery do SST).
 * Envia a resposta pelo Evolution quando o canal for WhatsApp.
 */
export async function processRunAgent(data: RunAgentJobData): Promise<{ ok: boolean }> {
  const conversa = await prisma.ocConversa.findFirst({
    where: {
      id: data.conversaId,
      organization_id: data.organizationId,
    },
    include: {
      canal: true,
      contato: true,
    },
  })

  if (!conversa) {
    console.warn('[run-agent] conversa não encontrada', data.conversaId)
    return { ok: false }
  }

  if (conversa.status !== 'bot' || !conversa.canal.ia_habilitada) {
    console.info(
      '[run-agent] ignorado status=%s ia=%s',
      conversa.status,
      conversa.canal.ia_habilitada,
    )
    return { ok: false }
  }

  let agente = conversa.agente_ia_id
    ? await prisma.ocAgente.findFirst({
        where: {
          id: conversa.agente_ia_id,
          organization_id: data.organizationId,
          ativo: true,
        },
      })
    : null

  if (!agente) {
    const cfg = asRecord(conversa.canal.config)
    const orchId =
      typeof cfg.agente_orquestrador_id === 'string'
        ? cfg.agente_orquestrador_id
        : null
    if (orchId) {
      agente = await prisma.ocAgente.findFirst({
        where: { id: orchId, organization_id: data.organizationId, ativo: true },
      })
    }
  }

  if (!agente) {
    agente = await prisma.ocAgente.findFirst({
      where: {
        organization_id: data.organizationId,
        ativo: true,
        tipo: 'orchestrator',
      },
      orderBy: { created_at: 'asc' },
    })
  }

  if (!agente) {
    agente = await prisma.ocAgente.findFirst({
      where: { organization_id: data.organizationId, ativo: true },
      orderBy: { created_at: 'asc' },
    })
  }

  if (!agente) {
    console.warn('[run-agent] nenhum agente ativo org=', data.organizationId)
    return { ok: false }
  }

  const configIA = await prisma.ocConfigIA.findUnique({
    where: { organization_id: data.organizationId },
  })

  const historico = await prisma.ocMensagem.findMany({
    where: {
      conversa_id: conversa.id,
      tipo: { not: 'system' },
    },
    orderBy: { created_at: 'desc' },
    take: 40,
  })

  const messages = historico
    .reverse()
    .filter((m) => !(asRecord(m.extra_data).nota_interna === true))
    .map((m) => ({
      role: m.autor_tipo === 'contato' ? 'user' : 'assistant',
      content: m.conteudo,
    }))

  const promptParts: string[] = []
  if (configIA?.contexto_negocio) {
    promptParts.push(`## Contexto do negócio\n${configIA.contexto_negocio}`)
  }
  if (agente.contexto_operacional) {
    promptParts.push(`## Contexto operacional\n${agente.contexto_operacional}`)
  }
  promptParts.push(agente.system_prompt || 'Você é um assistente de atendimento.')

  const started = Date.now()
  const execucao = await prisma.ocExecucao.create({
    data: {
      organization_id: data.organizationId,
      conversa_id: conversa.id,
      agente_id: agente.id,
      status: 'running',
      input_data: toInputJson({ context: data.context ?? null }),
    },
  })

  try {
    const reply = await callOpenAi(
      agente.modelo,
      promptParts.join('\n\n'),
      messages,
      agente.temperatura,
    )

    const msg = await prisma.ocMensagem.create({
      data: {
        organization_id: data.organizationId,
        conversa_id: conversa.id,
        autor_tipo: 'agente',
        autor_id: agente.id,
        tipo: 'text',
        conteudo: reply,
        is_read: true,
        extra_data: toInputJson({ origem: 'oc-worker' }),
      },
    })

    const now = new Date()
    await prisma.ocConversa.update({
      where: { id: conversa.id },
      data: {
        last_message_at: now,
        last_bot_at: now,
        first_response_at: conversa.first_response_at ?? now,
        agente_ia_id: agente.id,
        is_stuck: false,
      },
    })

    // Envio WhatsApp
    if (conversa.canal.tipo === 'whatsapp_evolution' && conversa.contato.telefone) {
      const canalCfg = asRecord(conversa.canal.config)
      const instanceName =
        typeof canalCfg.instance_name === 'string' ? canalCfg.instance_name : null
      const instanceToken =
        typeof canalCfg.instance_token === 'string' ? canalCfg.instance_token : null
      if (instanceName) {
        const sent = await evolutionSendText(
          instanceName,
          conversa.contato.telefone,
          reply,
          instanceToken,
        )
        if (!sent) {
          console.error('[run-agent] falha envio Evolution msg=', msg.id)
        }
      }
    }

    await prisma.ocExecucao.update({
      where: { id: execucao.id },
      data: {
        status: 'success',
        output_data: toInputJson({ reply }),
        duration_ms: Date.now() - started,
        finished_at: new Date(),
      },
    })

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.ocExecucao.update({
      where: { id: execucao.id },
      data: {
        status: 'error',
        error_msg: message.slice(0, 1000),
        duration_ms: Date.now() - started,
        finished_at: new Date(),
      },
    })
    throw err
  }
}
