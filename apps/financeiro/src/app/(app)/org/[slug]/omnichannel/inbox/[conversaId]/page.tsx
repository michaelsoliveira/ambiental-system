'use client';
import { use } from 'react';
import { OcInboxShell } from '@/features/omnichannel/components/inbox/oc-inbox-shell';
import { OcThread } from '@/features/omnichannel/components/OcThread';

export default function ConversaPage({ params }: { params: Promise<{ conversaId: string }> }) {
  const { conversaId } = use(params);
  return (
    <OcInboxShell conversaAtivaId={conversaId}>
      <OcThread conversaId={conversaId} />
    </OcInboxShell>
  );
}
