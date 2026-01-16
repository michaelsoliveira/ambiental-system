import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { ExportButtonCsvLicenca } from '@/features/licenca/components/export-button-csv-licenca';
import { LicencaHeaderPage } from '@/features/licenca/components/licenca-header';
import LicencaListingPage from '@/features/licenca/components/licenca-listing';
import LicencaTableAction from '@/features/licenca/components/licenca-tables/licenca-table-action';
import ExportLicencaPdfButton from '@/features/licenca/components/pdf/export-licenca-pdf-button';
import { searchParamsCache, serialize } from '@/lib/searchparams';
import { cn, fetchAPI } from '@/lib/utils';
import { Download, Plus } from 'lucide-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Ocorrências'
};

export const dynamic = 'force-dynamic';

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  // This key is used for invoke suspense if any of the search params changed (used for filters).
  const key = serialize({ ...searchParams });

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col'>
        <LicencaHeaderPage />
        <Separator />
        <LicencaTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <LicencaListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
