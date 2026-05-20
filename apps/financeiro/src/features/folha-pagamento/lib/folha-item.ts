/** Resolve rubrica_id de itens legados (sem rubrica_id, só tipo/natureza). */
export function resolveRubricaIdFromItem(item: any, rubricasList: any[]): string {
  if (rubricasList.length === 0) return ''

  const directId = item.rubrica_id ?? item.rubrica?.id
  if (directId) return String(directId)

  const nomeBusca = (item.rubrica?.nome ?? item.descricao ?? '').trim()
  if (nomeBusca) {
    const match = rubricasList.find((rubrica) => rubrica.nome?.trim() === nomeBusca)
    if (match?.id) return String(match.id)
  }

  if (item.tipo) {
    const porTipo = rubricasList.find((rubrica) => rubrica.tipo_item === item.tipo)
    if (porTipo?.id) return String(porTipo.id)
  }

  return ''
}

export function labelRubricaItem(item: any, rubricasList: any[] = []) {
  if (item.rubrica?.nome) return item.rubrica.nome

  const rubricaId = resolveRubricaIdFromItem(item, rubricasList)
  if (rubricaId) {
    const rubrica = rubricasList.find((entry) => String(entry.id) === rubricaId)
    if (rubrica?.nome) return rubrica.nome
  }

  return item.tipo ?? '—'
}
