'use client';

import { useRef, useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

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
    <div className="relative shrink-0">
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

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
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
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="oc-chat-attach-menu w-[180px] rounded-[10px] border-0 bg-white p-[3px_0] shadow-[0_1px_3px_rgb(11_20_26_/_0.1),0_6px_16px_rgb(11_20_26_/_0.12)] dark:bg-[oklch(0.28_0.01_285)]"
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
        </PopoverContent>
      </Popover>
    </div>
  );
}
