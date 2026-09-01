import { Suspense } from 'react';
import { OcLayout } from '@/features/omnichannel/components/OcLayout';
import '@/features/omnichannel/styles/oc-chat.css';

export default function OmnichannelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Carregando…</div>}>
        <OcLayout>{children}</OcLayout>
      </Suspense>
    </div>
  );
}
