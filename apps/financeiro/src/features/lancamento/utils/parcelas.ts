export type ParcelaFormItem = {
  numero_parcela: number
  data_vencimento: string
  valor: string
  pago: boolean
  status_parcela: 'PENDENTE' | 'PAGA' | 'CANCELADA' | 'ATRASADA'
}

export function gerarParcelasPadrao(params: {
  formaParcelamento: string
  numeroParcelas: number
  valorTotal: number
  dataVencimento?: string
}): ParcelaFormItem[] {
  const { formaParcelamento, numeroParcelas, valorTotal, dataVencimento } = params
  if (numeroParcelas <= 0 || valorTotal <= 0) return []

  const valorPorParcela =
    formaParcelamento === 'RECORRENTE' ? valorTotal : valorTotal / numeroParcelas
  const dataBase = dataVencimento ? new Date(`${dataVencimento}T12:00:00`) : new Date()
  const parcelas: ParcelaFormItem[] = []

  for (let i = 1; i <= numeroParcelas; i++) {
    const dataVencimentoParcela = new Date(dataBase)
    dataVencimentoParcela.setMonth(dataVencimentoParcela.getMonth() + (i - 1))

    parcelas.push({
      numero_parcela: i,
      data_vencimento: dataVencimentoParcela.toISOString().split('T')[0]!,
      valor: valorPorParcela.toFixed(2),
      pago: false,
      status_parcela: 'PENDENTE',
    })
  }

  return parcelas
}
