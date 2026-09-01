import {
  Filter,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Star,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { IconType } from 'react-icons';
import { SiInstagram } from 'react-icons/si';

export type InboxIcon = LucideIcon | IconType;

export const INBOX_ICON_OPTIONS: { key: string; icon: InboxIcon }[] = [
  { key: 'inbox', icon: Inbox },
  { key: 'message', icon: MessageSquare },
  { key: 'phone', icon: Phone },
  { key: 'instagram', icon: SiInstagram },
  { key: 'mail', icon: Mail },
  { key: 'send', icon: Send },
  { key: 'users', icon: Users },
  { key: 'tag', icon: Tag },
  { key: 'star', icon: Star },
  { key: 'filter', icon: Filter },
];

export const INBOX_ICON_MAP: Record<string, InboxIcon> = Object.fromEntries(
  INBOX_ICON_OPTIONS.map((o) => [o.key, o.icon]),
);

export const INBOX_COLOR_OPTIONS: { key: string; swatch: string; ring: string }[] = [
  { key: 'gray', swatch: 'bg-zinc-400', ring: 'ring-zinc-900' },
  { key: 'green', swatch: 'bg-emerald-500', ring: 'ring-emerald-700' },
  { key: 'pink', swatch: 'bg-pink-500', ring: 'ring-pink-700' },
  { key: 'purple', swatch: 'bg-violet-500', ring: 'ring-violet-700' },
  { key: 'blue', swatch: 'bg-blue-500', ring: 'ring-blue-700' },
  { key: 'orange', swatch: 'bg-orange-500', ring: 'ring-orange-700' },
  { key: 'red', swatch: 'bg-red-500', ring: 'ring-red-700' },
];

export const INBOX_COLOR_MAP: Record<string, string> = Object.fromEntries(
  INBOX_COLOR_OPTIONS.map((o) => [o.key, o.swatch]),
);

export const INBOX_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'open', label: 'Aberta' },
  { value: 'bot', label: 'Aguardando' },
  { value: 'closed', label: 'Fechada' },
] as const;

export const INBOX_ATRIBUICAO_OPTIONS = [
  { value: 'qualquer', label: 'Qualquer pessoa' },
  { value: 'minha', label: 'Minhas conversas' },
  { value: 'nao_atribuida', label: 'Não atribuídas' },
] as const;

export const INBOX_TIPO_CONVERSA_OPTIONS = [
  { value: 'todas', label: 'Todas' },
  { value: 'individual', label: 'Apenas individuais' },
  { value: 'grupo', label: 'Apenas grupos' },
] as const;
