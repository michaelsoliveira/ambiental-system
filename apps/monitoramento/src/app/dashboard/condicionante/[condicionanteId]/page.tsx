import notFound from '@/app/not-found';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import CondicionanteViewPage from '@/features/condicionante/components/condicionante-view-page';
import LicencaViewPage from '@/features/licenca/components/licenca-view-page';
import { auth } from '@/lib/auth';
import { fetchAPI } from '@/lib/utils';
import { Suspense } from 'react';
import { CondicionanteType } from 'types';

export const metadata = {
  title: 'Dashboard : Condicionante View'
};

type PageProps = { params: Promise<{ condicionanteId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params; 
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <CondicionanteViewPage condicionanteId={params.condicionanteId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
