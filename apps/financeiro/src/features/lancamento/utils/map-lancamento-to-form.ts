import type { LancamentoFormValues } from './form-schema'

function toFormId(value: unknown): string {
  if (value == null || value === '') return ''
  return String(value)
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
      ? new Date(initialData.data).toISOString().split('T')[0]!
      : new Date().toISOString().split('T')[0]!,
    data_vencimento: initialData?.data_vencimento
      ? new Date(initialData.data_vencimento).toISOString().split('T')[0]!
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
        ? new Date(p.data_vencimento).toISOString().split('T')[0]!
        : '',
      valor:
        typeof p.valor === 'number' ? p.valor.toFixed(2) : String(p.valor ?? '0'),
      pago: p.pago ?? false,
      status_parcela: p.status_parcela ?? 'PENDENTE',
      observacoes: p.observacoes ?? undefined,
    })),
  }
}
