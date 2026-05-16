/** Nome exibido do parceiro (PF, PJ fantasia ou razão social). */
export function getParceiroDisplayName(parceiro: {
  pessoa_nome?: string | null
  pessoa?: {
    tipo?: string
    fisica?: { nome?: string } | null
    juridica?: { nome_fantasia?: string; razao_social?: string | null } | null
  } | null
}): string {
  if (parceiro.pessoa_nome?.trim()) {
    return parceiro.pessoa_nome.trim()
  }
  const p = parceiro.pessoa
  if (!p) return 'Sem nome'
  if (p.tipo === 'F') {
    return p.fisica?.nome?.trim() || 'Sem nome'
  }
  return (
    p.juridica?.nome_fantasia?.trim() ||
    p.juridica?.razao_social?.trim() ||
    'Sem nome'
  )
}
