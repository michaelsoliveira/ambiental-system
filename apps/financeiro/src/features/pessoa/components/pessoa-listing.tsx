'use client'

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DataTable as PessoaTable } from '@/components/ui/table/data-table';
import { useDebounce } from '@/hooks/use-debounce';
import { usePessoas } from '@/hooks/use-pessoas';

import { EditPessoaDialog } from './edit-pessoa-dialog';
import { PessoaFilters } from './pessoa-filters';
import { getColumns } from './pessoa-tables/columns';
import { usePessoaTableFilters } from './pessoa-tables/use-pessoa-table-filters';

export default function PessoaListingPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { 
    searchQuery,
    page,
    limit,
    cidade,
    estado,
    tipo,
    hasEmail,
    hasPhone,
    createdAfter,
    createdBefore,
    orderBy,
    order,
  } = usePessoaTableFilters();

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const debouncedSetSearch = useDebounce<(search: string) => void>(
    (search: string) => {
      setDebouncedSearch(search);
    },
    500
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchQuery, debouncedSetSearch]);

  const params = useMemo(() => {
    return {
      search: debouncedSearch || undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      cidade: cidade || undefined,
      estado: estado || undefined,
      tipo: tipo || undefined,
      has_email: hasEmail || undefined,
      has_phone: hasPhone || undefined,
      created_after: createdAfter || undefined,
      created_before: createdBefore || undefined,
      order_by: orderBy || 'created_at',
      order: order || 'desc',
    };
  }, [
    debouncedSearch,
    page,
    limit,
    cidade,
    estado,
    tipo,
    hasEmail,
    hasPhone,
    createdAfter,
    createdBefore,
    orderBy,
    order,
  ]);

  const { data: responsePessoas, error, isLoading, isFetching } = usePessoas(slug, params);
  
  const { data: pessoas = [], pagination }: any = responsePessoas ?? { 
    pessoas: [], 
    pagination: { count: 0 } 
  };

  const [selectedPessoa, setSelectedPessoa] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleRowClick = useCallback((pessoa: any) => {
    setSelectedPessoa(pessoa);
    setIsDialogOpen(true);
  }, []);

  const columns = useMemo(() => getColumns(handleRowClick), [handleRowClick]);

  if (error && pessoas.length === 0) {
    console.error('Erro ao buscar pessoas:', error);
    return <div>Erro ao carregar pessoas</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filtros de busca */}
        <PessoaFilters />

        {/* ⭐ Indicador de carregamento sem remontagem */}
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregando...
          </div>
        )}
        
        {/* Tabela de dados */}
        <PessoaTable
          columns={columns}
          data={pessoas}
          totalItems={pagination.count || 0}
          page={Number(page) ?? 1}
          pageSizeOptions={[50, 100, 200, 500, 1000]}
        />
      </div>
      
      <EditPessoaDialog
        pessoa={selectedPessoa}
        className="md:max-w-4xl"
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
      />
    </>
  );
}