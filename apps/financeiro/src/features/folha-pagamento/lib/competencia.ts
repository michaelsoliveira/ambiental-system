/** Formato exigido pela API: MM/AAAA (ex.: 04/2026). */
const COMPETENCIA_PATTERN = /^\d{2}\/\d{4}$/

export function normalizeCompetencia(value: string): string | null {
  const trimmed = value.replace(/_/g, '').trim()
  if (!trimmed) return null

  if (COMPETENCIA_PATTERN.test(trimmed)) {
    const [mes, ano] = trimmed.split('/')
    const mesNum = Number(mes)
    if (mesNum >= 1 && mesNum <= 12) return trimmed
    return null
  }

  const comBarra = trimmed.match(/^(\d{1,2})\/(\d{4})$/)
  if (comBarra) {
    const mesNum = Number(comBarra[1])
    const ano = Number(comBarra[2])
    if (mesNum >= 1 && mesNum <= 12) {
      return `${String(mesNum).padStart(2, '0')}/${ano}`
    }
    return null
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 6) {
    const mesNum = Number(digits.slice(0, 2))
    const ano = Number(digits.slice(2))
    if (mesNum >= 1 && mesNum <= 12) {
      return `${String(mesNum).padStart(2, '0')}/${ano}`
    }
  }

  return null
}

export function isValidCompetencia(value: string) {
  return normalizeCompetencia(value) !== null
}

export function competenciaAtual() {
  const now = new Date()
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}
