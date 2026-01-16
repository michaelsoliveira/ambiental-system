import notFound from '@/app/not-found';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import LicencaViewPage from '@/features/licenca/components/licenca-view-page';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Licença View'
};

type PageProps = { params: Promise<{ licencaId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
 
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <LicencaViewPage licencaId={params.licencaId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
