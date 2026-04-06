'use client'

import { useParams } from 'next/navigation'

import { DataTable } from '@/components/ui/table/data-table';
import { useContas } from '@/hooks/use-conta'

import { columns } from './conta-tables/columns';
import ContaTableAction from './conta-tables/conta-table-action';
import { useContaTableFilters } from './conta-tables/use-conta-table-filters';

export default function ContaListingPage() {
  try {
    const { slug } = useParams<{ slug: string }>()
    const { 
      searchQuery,
      page,
      orderBy,
      order,
      ativo,
      tipo
    } = useContaTableFilters();
    
    const { data: responseData, error, isLoading } = useContas(slug!, {
      search: searchQuery,
      page,
      orderBy,
      order: order as 'asc' | 'desc',
      ativo: ativo ? (ativo === 'true') : undefined,
      tipo: tipo as 'BANCARIA' | 'CONTABIL' | undefined,
      limit: 10
    });

    const { contas = [], total = 0 } = responseData ?? { contas: [], total: 0 };
    
    if (isLoading) return <div>Carregando...</div>;
    
    if (error) {
      console.error('Erro ao buscar contas:', error);
      return <div>Erro ao carregar contas</div>;
    }
      
    return (
      <div className="space-y-4">
        <ContaTableAction />
        <DataTable
          columns={columns}
          data={contas}
          totalItems={total}
          page={page}
          pageSizeOptions={[10, 20, 30, 40, 50]}
        />
      </div>
    );
    
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return <div>Erro interno do servidor</div>;
  }
}
