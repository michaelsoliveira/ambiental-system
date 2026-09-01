import { MessageCircle, Send, Globe, LayoutTemplate } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { cn } from '@/lib/utils';
import type { TipoCanal } from '../../types';

const WHATSAPP_GREEN = 'text-emerald-600';

export function OcCanalIcon({
  tipo,
  className,
}: {
  tipo?: string;
  className?: string;
}) {
  const cls = cn('h-3.5 w-3.5 shrink-0', className);
  switch (tipo as TipoCanal) {
    case 'whatsapp_evolution':
      return <MessageCircle className={cn(cls, WHATSAPP_GREEN)} />;
    case 'instagram':
      return <SiInstagram className={cn(cls, 'text-pink-600')} />;
    case 'telegram':
      return <Send className={cn(cls, 'text-sky-600')} />;
    case 'landing_form':
      return <LayoutTemplate className={cn(cls, 'text-primary')} />;
    default:
      return <Globe className={cn(cls, 'text-muted-foreground')} />;
  }
}

export function canalTipoLabel(tipo?: string) {
  switch (tipo) {
    case 'whatsapp_evolution':
      return 'WHATSAPP';
    case 'instagram':
      return 'INSTAGRAM';
    case 'telegram':
      return 'TELEGRAM';
    case 'email':
      return 'E-MAIL';
    case 'webchat':
      return 'WEBCHAT';
    case 'landing_form':
      return 'LANDING';
    default:
      return (tipo ?? 'CANAL').toUpperCase().replace(/_/g, ' ');
  }
}
