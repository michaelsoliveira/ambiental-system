'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { contactInitials } from '../lib/oc-contact-display';
import type { OcContato } from '../types';

type OcContactAvatarProps = {
  contato?: OcContato | null;
  className?: string;
  fallbackClassName?: string;
};

export function OcContactAvatar({
  contato,
  className,
  fallbackClassName,
}: OcContactAvatarProps) {
  const initials = contactInitials(contato);
  const src = contato?.avatar_url?.trim();

  return (
    <Avatar className={cn('shrink-0', className)}>
      {src ? (
        <AvatarImage src={src} alt={contato?.nome ?? initials} referrerPolicy="no-referrer" />
      ) : null}
      <AvatarFallback
        className={cn(
          'bg-muted text-sm font-semibold text-muted-foreground',
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
