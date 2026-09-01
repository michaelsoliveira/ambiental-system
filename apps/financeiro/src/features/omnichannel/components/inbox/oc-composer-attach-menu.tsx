'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileText,
  ImageIcon,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type AttachKind = 'document' | 'media';

const MENU_ITEMS: Array<{
  id: string;
  label: string;
  kind?: AttachKind;
  icon: React.ElementType;
  iconClass: string;
  enabled: boolean;
}> = [
  { id: 'document', label: 'Arquivo', kind: 'document', icon: FileText, iconClass: 'bg-[#5b72e8] text-white', enabled: true },
  { id: 'media', label: 'Fotos e vídeos', kind: 'media', icon: ImageIcon, iconClass: 'bg-[#7f66ff] text-white', enabled: true },
  { id: 'poll', label: 'Enquete', icon: BarChart3, iconClass: 'bg-[#ffbc38] text-white', enabled: false },
  { id: 'event', label: 'Evento', icon: Calendar, iconClass: 'bg-[#ff6b6b] text-white', enabled: false },
  { id: 'ai', label: 'Imagens de IA', icon: Sparkles, iconClass: 'bg-[#0ea5e9] text-white', enabled: false },
  { id: 'contact', label: 'Contato', icon: User, iconClass: 'bg-[#ff8a3d] text-white', enabled: false },
];

export function OcComposerAttachMenu({
  disabled,
  onFileSelect,
}: {
  disabled?: boolean;
  onFileSelect: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handlePick = (kind: AttachKind) => {
    if (disabled) return;
    if (kind === 'document') docInputRef.current?.click();
    else mediaInputRef.current?.click();
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onFileSelect(file);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <input
        ref={docInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,application/*"
        onChange={handleChange}
      />
      <input
        ref={mediaInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleChange}
      />

      {open ? (
        <div
          className="oc-chat-attach-menu absolute bottom-[calc(100%+6px)] left-0 z-20 w-[180px]"
          role="menu"
        >
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  if (!item.enabled) {
                    toast.info('Recurso em breve');
                    return;
                  }
                  if (item.kind) handlePick(item.kind);
                }}
                className={cn(
                  'oc-chat-attach-menu-item',
                  !item.enabled && 'opacity-55',
                )}
              >
                <span className={cn('oc-chat-attach-menu-icon', item.iconClass)}>
                  <Icon />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-10 w-10 rounded-full hover:bg-background',
          open && 'rotate-45 bg-background',
        )}
        aria-label={open ? 'Fechar anexos' : 'Anexar arquivo'}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Plus className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
