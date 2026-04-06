/**
 * Serviço de integração com o gateway de pagamentos Asaas
 * Baseado na implementação do Judify
 */

export interface AsaasClienteParams {
  name: string
  email?: string
  cpfCnpj?: string
  phone?: string
  mobilePhone?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  province?: string
  city?: string
  state?: string
}

export interface AsaasCobrancaParams {
  customer: string
  value: number
  dueDate: string // YYYY-MM-DD
  description: string
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD'
  externalReference?: string
}

export interface AsaasPaymentResponse {
  id: string
  dateCreated: string
  value: number
  netValue?: number
  billingType: string
  status: string
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string
  identificationField?: string
  invoiceNumber?: string
}

export class AsaasService {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey
    this.baseUrl = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3'
  }

  async criarCliente(params: AsaasClienteParams): Promise<{ id: string }> {
    const payload = {
      name: params.name,
      email: params.email || undefined,
      cpfCnpj: params.cpfCnpj || undefined,
      phone: params.phone || undefined,
      mobilePhone: params.mobilePhone || undefined,
      postalCode: params.postalCode || undefined,
      address: params.address || undefined,
      addressNumber: params.addressNumber || undefined,
      province: params.province || undefined,
      city: params.city || undefined,
      state: params.state || undefined,
    }

    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Erro ao criar cliente no Asaas: ${response.status} - ${JSON.stringify(error)}`
      )
    }

    const result = await response.json()
    return { id: result.id }
  }

  async criarCobranca(params: AsaasCobrancaParams): Promise<AsaasPaymentResponse> {
    const payload = {
      customer: params.customer,
      billingType: params.billingType,
      value: params.value,
      dueDate: params.dueDate,
      description: params.description,
      ...(params.externalReference && { externalReference: params.externalReference }),
    }

    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Erro ao criar cobrança no Asaas: ${response.status} - ${JSON.stringify(error)}`
      )
    }

    return response.json()
  }

  async consultarCobranca(paymentId: string): Promise<AsaasPaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': this.apiKey,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Cobrança não encontrada no Asaas')
      }
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Erro ao consultar cobrança no Asaas: ${response.status} - ${JSON.stringify(error)}`
      )
    }

    return response.json()
  }

  async cancelarCobranca(paymentId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'access_token': this.apiKey,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      throw new Error(`Erro ao cancelar cobrança no Asaas: ${response.status} - ${error}`)
    }
  }
}
