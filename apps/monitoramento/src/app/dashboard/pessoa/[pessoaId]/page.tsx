import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import PessoaViewPage from '@/features/pessoa/components/pessoa-view-page';

export const metadata = {
  title: 'Dashboard : Pessoa View'
};

type PageProps = { params: Promise<{ pessoaId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <PessoaViewPage pessoaId={params.pessoaId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
