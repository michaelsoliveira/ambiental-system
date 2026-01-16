'use client';

import { Suspense, useEffect, useState } from 'react';
import { LancamentoListing } from '@/features/lancamento/components/lancamento-listing';
import { useGetCategorias, useGetContas, useGetCentrosCusto, useGetParceiros } from '@/hooks/use-lancamentos';
import { Loader, PlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import LancamentoTableAction from '@/features/lancamento/components/lancamento-tables/lancamento-table-action';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { EditLancamentoDialog } from '@/features/lancamento/components/edit-lancamento-dialog';

export default function LancamentosPage() {
    const [mounted, setMounted] = useState(false);
    const { slug } = useParams<{ slug: string }>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    // Buscar dados necessários
    const { data: categoriasData, isLoading: loadingCategorias } = useGetCategorias(slug);
    const { data: contasData, isLoading: loadingContas } = useGetContas(slug);
    const { data: centrosCustoData, isLoading: loadingCentros } = useGetCentrosCusto(slug);
    const { data: parceirosData, isLoading: loadingParceiros } = useGetParceiros(slug);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return null;
    }

    const isLoading = loadingCategorias || loadingContas || loadingCentros;

    const categorias = categoriasData?.categorias || [];
    const contas = contasData?.contas || [];
    const centrosCusto = centrosCustoData?.centros || [];
    const parceiros = parceirosData?.parceiros || [];

    return (
      <>
      {
          isLoading && (
            <div className="flex justify-center items-center h-screen">
                <div className="flex flex-col items-center gap-4">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
          )
      }
      <div className="space-y-6 p-6">
      <div className='flex items-start justify-between'>
          <Heading title='Lançamentos' description='Gerencie seus lançamentos financeiros de receitas, despesas e transferências' />
          <EditLancamentoDialog
            className="md:max-w-4xl overflow-y-auto"
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            categorias={categorias}
            contas={contas}
            centrosCusto={centrosCusto}  
            parceiros={parceiros}
            trigger={(
              <Button
                className='rounded-full p-4 shadow-xl'
              >
                <PlusIcon className='h-5 w-5 mr-2' />
                Adicionar
              </Button>
            )}
          />
        </div>
        
        <Separator />
        {/* <LancamentoTableAction /> */}
        <Suspense fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}></Suspense>
        <LancamentoListing
          categorias={categorias}
          contas={contas}
          centrosCusto={centrosCusto}
          parceiros={parceiros}
        />
      </div>
      </>
    );
}