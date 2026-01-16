'use client'

import { DataTable } from '@/components/ui/table/data-table';
import { useCategorias } from '@/hooks/use-categoria';
import { useCategoriaTableFilters } from './categoria-tables/use-categoria-table-filters';
import { columns } from './categoria-tables/columns';
import CategoriaTableAction from './categoria-tables/categoria-table-action';
import { useParams } from 'next/navigation'

export default function CategoriaListingPage() {
  try {
    const { slug } = useParams<{ slug: string }>()
    const { 
      searchQuery,
      page,
      orderBy,
      order,
      ativo,
      tipo
    } = useCategoriaTableFilters();
    
    const { data: responseData, error, isLoading } = useCategorias(slug!, {
      search: searchQuery,
      page,
      orderBy,
      order: order as 'asc' | 'desc',
      ativo: ativo ? (ativo === 'true') : undefined,
      tipo: tipo as 'RECEITA' | 'DESPESA' | undefined,
      limit: 10
    });

    const { categorias = [], total = 0 } = responseData ?? { categorias: [], total: 0 };
    
    if (isLoading) return <div>Carregando...</div>;
    
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return <div>Erro ao carregar categorias</div>;
    }
      
    return (
      <div className="space-y-4">
        <CategoriaTableAction />
        <DataTable
          columns={columns}
          data={categorias}
          totalItems={total}
          page={page}
          pageSizeOptions={[10, 20, 30, 40, 50]}
        />
      </div>
    );
    
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return <div>Erro interno do servidor</div>;
  }
}
