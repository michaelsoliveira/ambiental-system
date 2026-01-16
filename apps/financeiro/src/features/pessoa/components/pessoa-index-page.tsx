'use client';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Suspense, useState } from 'react';
import PessoaListingPage from '@/features/pessoa/components/pessoa-listing';
import { EditPessoaDialog } from '@/features/pessoa/components/edit-pessoa-dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

export function PessoaIndexPage() {
    const [isDialogOpen, setDialogOpen] = useState(false);
    return (
        <div className='flex flex-1 flex-col space-y-4 p-6'>
            <div className='flex items-start justify-between'>
                <Heading
                    title='Pessoas'
                    description='Gerenciar Pessoas do Sistema'
                />
                <EditPessoaDialog
                className="md:max-w-5xl"
                open={isDialogOpen}
                trigger={
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="rounded-full p-4 shadow-xl"
                        >
                        <PlusIcon className="h-5 w-5 mr-2" />
                            Adicionar
                    </Button>
                }
                setOpen={setDialogOpen}
                />
            </div>
        <Separator />
        {/* <ContatoTableAction /> */}
        <Suspense
            
            fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
            <PessoaListingPage />
        </Suspense>
        </div>
    );
}
