'use client';

import { MessageSquare } from 'lucide-react';
import { OcInbox } from '../OcInbox';

type OcInboxShellProps = {
  conversaAtivaId?: string;
  children?: React.ReactNode;
};

export function OcInboxShell({ conversaAtivaId, children }: OcInboxShellProps) {
  return (
    <div className="oc-chat-shell flex h-full min-h-0 min-w-0 overflow-hidden">
      <OcInbox conversaAtivaId={conversaAtivaId} />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children ?? (
          <div className="oc-chat-messages-bg flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-background/80 px-8 py-6 shadow-sm backdrop-blur-sm">
              <MessageSquare className="h-12 w-12 opacity-25" />
              <p className="text-sm font-medium">Selecione uma conversa</p>
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                Escolha um contato na lista ao lado para visualizar e responder mensagens.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
