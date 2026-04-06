/**
 * Webhook para receber eventos do Asaas (pagamentos)
 * Baseado na implementação do Judify
 */
import type { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'

const STATUS_ASAAS_TO_LANCAMENTO: Record<string, string> = {
  PENDING: 'PENDENTE',
  RECEIVED: 'PAGO',
  OVERDUE: 'ATRASADO',
  REFUNDED: 'CANCELADO',
  RECEIVED_IN_CASH_UNDONE: 'PENDENTE',
  DUNNING_REQUESTED: 'ATRASADO',
  DUNNING_RECEIVED: 'PAGO',
}

export async function asaasPaymentsWebhook(app: FastifyInstance) {
  app.post(
    '/webhooks/asaas/payments',
    async (request, reply) => {
      const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN
      if (expectedToken) {
        const token = request.headers['asaas-access-token'] as string | undefined
        if (!token || token !== expectedToken) {
          return reply.status(401).send({ error: 'Token inválido' })
        }
      }

      const body = request.body as {
        event?: string
        payment?: {
          id?: string
          status?: string
          value?: number
          paymentDate?: string
          billingType?: string
        }
      }

      if (!body?.event || !body?.payment) {
        return reply.status(400).send({ error: 'Payload inválido' })
      }

      const { event, payment } = body
      const paymentId = payment.id
      if (!paymentId) {
        return reply.status(400).send({ error: 'Payment ID não encontrado' })
      }

      const statusAsaas = (payment.status ?? 'PENDING').toUpperCase()
      const statusLancamento = STATUS_ASAAS_TO_LANCAMENTO[statusAsaas] ?? 'PENDENTE'

      try {
        const lancamento = await prisma.lancamento.findFirst({
          where: { asaas_payment_id: paymentId },
        })

        if (!lancamento) {
          app.log.warn({ paymentId }, 'Lançamento não encontrado para asaas_payment_id')
          return reply.status(200).send({ received: true, message: 'Lançamento não encontrado' })
        }

        const updateData: Record<string, unknown> = {
          status_lancamento: statusLancamento,
        }

        if (statusAsaas === 'RECEIVED') {
          updateData.pago = true
          if (payment.paymentDate) {
            updateData.data_pagamento = new Date(payment.paymentDate)
          }
          if (payment.value != null) {
            updateData.valor_pago = payment.value
          }
        } else if (statusAsaas === 'REFUNDED') {
          updateData.pago = false
          updateData.data_pagamento = null
          updateData.valor_pago = null
        }

        await prisma.lancamento.update({
          where: { id: lancamento.id },
          data: updateData,
        })

        app.log.info({ lancamentoId: lancamento.id, paymentId, statusAsaas }, 'Webhook Asaas processado')
        return reply.status(200).send({ received: true, payment_id: paymentId })
      } catch (err) {
        app.log.error(err, 'Erro ao processar webhook Asaas')
        return reply.status(500).send({ error: 'Erro ao processar webhook' })
      }
    }
  )
}
