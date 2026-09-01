import type { LancamentoFormValues } from './form-schema'

function toFormId(value: unknown): string {
  if (value == null || value === '') return ''
  return String(value)
}

/**
 * Extrai yyyy-MM-dd no fuso de São Paulo (evita shift de dia ao usar toISOString que é UTC).
 */
function toLocalDateString(value: unknown): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : (value as Date)
  if (Number.isNaN(d.getTime())) return ''

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '01'
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Resolve FK do formulário a partir do campo plano ou do relacionamento incluído na API. */
function resolveRelationId(
  flatId: unknown,
  relation?: { id?: unknown } | null,
): string {
  return toFormId(flatId ?? relation?.id)
}

export function mapLancamentoToFormValues(initialData?: any): LancamentoFormValues {
  return {
    id: initialData?.id ?? undefined,
    numero: initialData?.numero ?? '',
    tipo: initialData?.tipo ?? 'DESPESA',
    controle_interno:
      initialData?.controle_interno ?? (initialData?.tipo ?? 'DESPESA') === 'DESPESA',
    gerar_boleto: initialData?.gerar_boleto ?? false,
    permitir_pix: initialData?.permitir_pix ?? false,
    data: initialData?.data
      ? toLocalDateString(initialData.data)
      : toLocalDateString(new Date()),
    data_vencimento: initialData?.data_vencimento
      ? toLocalDateString(initialData.data_vencimento)
      : '',
    descricao: initialData?.descricao ?? '',
    valor: initialData?.valor?.toString() ?? '',
    categoria_id: resolveRelationId(initialData?.categoria_id, initialData?.categoria),
    conta_bancaria_id: resolveRelationId(
      initialData?.conta_bancaria_id,
      initialData?.conta_bancaria,
    ),
    centro_custo_id: resolveRelationId(
      initialData?.centro_custo_id,
      initialData?.centro_custo,
    ),
    parceiro_id: resolveRelationId(initialData?.parceiro_id, initialData?.parceiro),
    forma_parcelamento: initialData?.forma_parcelamento ?? 'UNICA',
    numero_parcelas: initialData?.numero_parcelas?.toString() ?? '1',
    pago: initialData?.pago ?? false,
    status_lancamento: initialData?.status_lancamento ?? 'PENDENTE',
    observacoes: initialData?.observacoes ?? undefined,
    parcelas: (initialData?.parcelas ?? []).map((p: any) => ({
      id: p.id,
      numero_parcela: p.numero_parcela,
      data_vencimento: p.data_vencimento
        ? toLocalDateString(p.data_vencimento)
        : '',
      valor:
        typeof p.valor === 'number' ? p.valor.toFixed(2) : String(p.valor ?? '0'),
      pago: p.pago ?? false,
      status_parcela: p.status_parcela ?? 'PENDENTE',
      observacoes: p.observacoes ?? undefined,
    })),
  }
}
