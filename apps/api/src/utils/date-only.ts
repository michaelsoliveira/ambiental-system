/**
 * Helpers de data civil no fuso America/Sao_Paulo (UTC−03, sem horário de verão desde 2019).
 *
 * Evita off-by-one típicos de:
 * - `new Date('YYYY-MM-DD')` (UTC midnight)
 * - `new Date('YYYY-MM-DDTHH:mm:ss')` (usa TZ do servidor, frequentemente UTC no Docker)
 * - exibir com o dia do ISO UTC em vez do dia civil em São Paulo
 */

const BRAZIL_OFFSET = '-03:00'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function parts(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split('-').map((v) => Number(v))
  if (!y || !m || !d) {
    throw new Error(`Data inválida: ${dateStr}`)
  }
  return [y, m, d]
}

/** Início do dia civil em São Paulo (00:00:00.000−03:00). */
export function parseDateOnlyStart(dateStr: string): Date {
  const [y, m, d] = parts(dateStr.slice(0, 10))
  return new Date(`${y}-${pad(m)}-${pad(d)}T00:00:00.000${BRAZIL_OFFSET}`)
}

/** Fim do dia civil em São Paulo (23:59:59.999−03:00). */
export function parseDateOnlyEnd(dateStr: string): Date {
  const [y, m, d] = parts(dateStr.slice(0, 10))
  return new Date(`${y}-${pad(m)}-${pad(d)}T23:59:59.999${BRAZIL_OFFSET}`)
}

/** Soma/subtrai dias em uma data "YYYY-MM-DD", retornando outra "YYYY-MM-DD". */
export function addDaysToDateOnly(dateStr: string, days: number): string {
  const [y, m, d] = parts(dateStr.slice(0, 10))
  // Meio-dia UTC evita edge cases ao somar dias
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/**
 * Interpreta "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm[:ss]" (sem fuso) como horário de São Paulo.
 * Strings já com Z ou offset explícito passam por `new Date` normal.
 */
export function parseBrazilDateTime(value: string): Date {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Data inválida: valor vazio')
  }

  // Já tem fuso (Z ou ±HH:mm)
  if (/Z$/i.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed)
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Data inválida: ${value}`)
    }
    return d
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  )
  if (!match) {
    const d = new Date(trimmed)
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Data inválida: ${value}`)
    }
    return d
  }

  const [, y, mo, d, h = '00', mi = '00', s = '00'] = match
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${BRAZIL_OFFSET}`
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data inválida: ${value}`)
  }
  return parsed
}

/** Dia civil YYYY-MM-DD em São Paulo a partir de um Date. */
export function formatBrazilDateOnly(date: Date): string {
  const partsFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => partsFmt.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}
