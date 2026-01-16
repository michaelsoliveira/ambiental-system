'use client'

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { PlusIcon } from 'lucide-react';
import { Suspense, useState } from 'react';
import { UserEditDialog } from '@/features/user/components/user-edit-dialog';
import UserTableAction from '@/features/user/components/user-tables/user-table-action';
import { UserListing } from '@/features/user/components/user-listing';

export default function Page() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Usuários'
            description='Gerenciar os Usuários do Sistema'
          />
          <div className='space-x-2'>
            <UserEditDialog
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
            {/* <Link
              href='/dashboard/condicionante/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <Plus className='mr-2 h-4 w-4' /> Adicionar
            </Link> */}
          </div>
        </div>
        <Separator />
        <UserTableAction />
        <Suspense
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <UserListing />
        </Suspense>
      </div>
    </PageContainer>
  );
}
