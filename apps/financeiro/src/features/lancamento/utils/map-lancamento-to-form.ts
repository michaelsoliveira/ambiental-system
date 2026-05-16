import type { LancamentoFormValues } from './form-schema'

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
    categoria_id: initialData?.categoria_id ?? '',
    conta_bancaria_id: initialData?.conta_bancaria_id ?? '',
    centro_custo_id: initialData?.centro_custo_id ?? '',
    parceiro_id: initialData?.parceiro_id ?? '',
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
