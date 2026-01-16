import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { LicencaCondicionanteListing } from '@/features/licenca-condicionante/components/licenca-condicionante-listing'
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function LicencaCondicionantesPage(props: pageProps) {
  const searchParams = await props.searchParams;
    // Allow nested RSCs to access the search params (in a type-safe way)
    searchParamsCache.parse(searchParams);
  
    // This key is used for invoke suspense if any of the search params changed (used for filters).
    const key = serialize({ ...searchParams });

    return (
      <PageContainer scrollable>
        <div className='flex flex-1 flex-col'>
          <Suspense
            key={key}
            fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
          >
            <LicencaCondicionanteListing />
          </Suspense>
        </div>
      </PageContainer>
    );
}
