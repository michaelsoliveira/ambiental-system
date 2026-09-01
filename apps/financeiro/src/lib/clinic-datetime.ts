import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Fuso padrão da clínica (backend grava UTC naive). */
export const CLINIC_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte ISO do backend (UTC sem sufixo) em instante UTC.
 * Sem o "Z", o JS interpreta como hora local (+3h no Brasil).
 */
export function parseClinicDateTime(raw?: string | null): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const normalized =
    s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s) ? s : `${s}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

type WallParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

/** Componentes de data/hora “de parede” no fuso da clínica (ex.: FullCalendar). */
export function getClinicWallParts(date: Date): WallParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

export function formatClinicWallDate(date: Date): string {
  const p = getClinicWallParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

export function formatClinicWallTimeHM(date: Date): string {
  const p = getClinicWallParts(date);
  return `${p.hour}:${p.minute}`;
}

/** ISO sem fuso para API de agenda (data/horário locais da clínica). */
export function formatClinicWallNaiveIso(date: Date): string {
  const p = getClinicWallParts(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`;
}

/** Formata um Date (instante) no fuso da clínica — uso em FullCalendar/modais. */
export function formatClinicDateFromDate(
  date: Date,
  pattern: 'date' | 'time' | 'datetime' = 'datetime',
): string {
  if (Number.isNaN(date.getTime())) return '—';
  const p = getClinicWallParts(date);
  if (pattern === 'date') {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: CLINIC_TIMEZONE,
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
  if (pattern === 'time') {
    return `${p.hour}:${p.minute}`;
  }
  return `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}`;
}

/**
 * Formata data civil (YYYY-MM-DD) sem deslocamento de fuso.
 * `new Date("2026-01-01")` é UTC meia-noite → em America/Sao_Paulo vira 31/12/2025.
 */
export function formatDateOnlyBr(value?: string | null, empty = '—'): string {
  if (!value) return empty;
  const m = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = parseClinicDateTime(value);
  if (!d) return empty;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: CLINIC_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Formata data/hora no fuso da clínica (Brasília). */
export function formatClinicDateTime(
  raw?: string | null,
  pattern = "dd/MM/yyyy 'às' HH:mm",
): string {
  const d = parseClinicDateTime(raw);
  if (!d) return '—';
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: CLINIC_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '';

    if (pattern === "dd/MM/yyyy 'às' HH:mm") {
      return `${get('day')}/${get('month')}/${get('year')} às ${get('hour')}:${get('minute')}`;
    }
    if (pattern === 'dd/MM/yyyy - HH:mm') {
      return `${get('day')}/${get('month')}/${get('year')} - ${get('hour')}:${get('minute')}`;
    }

    return format(d, pattern, { locale: ptBR });
  } catch {
    return '—';
  }
}
