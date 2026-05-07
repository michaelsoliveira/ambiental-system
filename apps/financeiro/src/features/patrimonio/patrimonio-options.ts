export const categoriaPatrimonioOptions = [
  { value: 'IMOVEL', label: 'Imóvel' },
  { value: 'VEICULO', label: 'Veículo' },
  { value: 'MAQUINA_EQUIPAMENTO', label: 'Máquina/Equipamento' },
  { value: 'MOVEL_UTENSILIO', label: 'Móvel/Utensílio' },
  { value: 'INFORMATICA', label: 'Informática' },
  { value: 'INVESTIMENTO', label: 'Investimento' },
  { value: 'ESTOQUE', label: 'Estoque' },
  { value: 'OUTRO', label: 'Outro' },
] as const

export const statusAtivoOptions = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'BAIXADO', label: 'Baixado' },
  { value: 'VENDIDO', label: 'Vendido' },
  { value: 'INATIVO', label: 'Inativo' },
] as const

export const metodoDepreciacaoOptions = [
  { value: 'LINEAR', label: 'Linear' },
  { value: 'ACELERADA', label: 'Acelerada' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'NAO_DEPRECIA', label: 'Não deprecia' },
] as const

export const tipoPassivoOptions = [
  { value: 'EMPRESTIMO', label: 'Empréstimo' },
  { value: 'FINANCIAMENTO', label: 'Financiamento' },
  { value: 'PARCELAMENTO', label: 'Parcelamento' },
  { value: 'FORNECEDOR', label: 'Fornecedor' },
  { value: 'TRIBUTO', label: 'Tributo' },
  { value: 'TRABALHISTA', label: 'Trabalhista' },
  { value: 'OUTRO', label: 'Outro' },
] as const

export const statusPassivoOptions = [
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'ATRASADO', label: 'Atrasado' },
  { value: 'QUITADO', label: 'Quitado' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const

export function getOptionLabel(options: readonly { value: string; label: string }[], value?: string | null) {
  return options.find((option) => option.value === value)?.label || value || '-'
}
