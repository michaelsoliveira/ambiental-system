'use client'

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { PlusIcon } from 'lucide-react';
import { Suspense, useState } from 'react';
import { UserEditDialog } from '@/features/user/components/user-edit-dialog';
import TipoLicencaTableAction from '@/features/tipo-licenca/components/tipo-licenca-table/tipo-licenca-table-action';
import { TipoLicencaListing } from '@/features/tipo-licenca/components/tipo-licenca-listing';
import { TipoLicencaEditDialog } from '@/features/tipo-licenca/components/tipo-licenca-edit-dialog';

export default function Page() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Tipos de Licença'
            description='Gerenciar os Tipos de Licença do Sistema'
          />
          <div className='space-x-2'>
            <TipoLicencaEditDialog
              className="max-w-3xl"
              open={isDialogOpen}
              trigger={
                <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="rounded-full p-4 shadow-xl"
                    >
                    <PlusIcon className="h-5 w-5 mr-2" />
                        Adicionar
                </Button>
              }
            />
          </div>
        </div>
        <Separator />
        <TipoLicencaTableAction />
        <Suspense
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <TipoLicencaListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}
