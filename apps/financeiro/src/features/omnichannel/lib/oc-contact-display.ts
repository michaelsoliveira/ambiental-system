import {
  formatClinicWallTimeHM,
  getClinicWallParts,
  parseClinicDateTime,
} from '@/lib/clinic-datetime';
import type { OcContato } from '../types';

export function contactInitials(contato?: OcContato | null): string {
  const nome = contato?.nome?.trim();
  if (nome && !/^\d+$/.test(nome.replace(/\D/g, ''))) {
    const parts = nome.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nome.slice(0, 2).toUpperCase();
  }
  const tel = contato?.telefone?.replace(/\D/g, '') ?? '';
  return tel.slice(-2) || '?';
}

export function formatContactLine(contato?: OcContato | null) {
  const nome = contato?.nome?.trim();
  const tel = contato?.telefone;
  const telFmt =
    (contato as { telefone_formatado?: string } | undefined)?.telefone_formatado ||
    tel;

  const nomeEhTelefone =
    !nome ||
    nome === tel ||
    nome.replace(/\D/g, '') === tel?.replace(/\D/g, '');

  if (!nomeEhTelefone && nome) {
    return {
      title: nome,
      subtitle: telFmt ? `@${telFmt.replace(/^\+/, '')}` : undefined,
    };
  }

  return {
    title: telFmt || nome || 'Contato',
    subtitle: tel && telFmt !== tel ? `@${tel}` : undefined,
  };
}

export function formatMessageTime(iso?: string) {
  const d = parseClinicDateTime(iso);
  if (!d) return '';
  const wall = getClinicWallParts(d);
  const nowWall = getClinicWallParts(new Date());
  const isToday =
    wall.year === nowWall.year &&
    wall.month === nowWall.month &&
    wall.day === nowWall.day;
  if (isToday) {
    return formatClinicWallTimeHM(d);
  }
  return `${wall.day}/${wall.month}`;
}
