'use client'

import { DataTable } from '@/components/ui/table/data-table';
import { useCentrosCusto } from '@/hooks/use-centro-custo';
import { useCentroCustoTableFilters } from './centro-custo-tables/use-centro-custo-table-filters';
import { columns } from './centro-custo-tables/columns';
import CentroCustoTableAction from './centro-custo-tables/centro-custo-table-action';
import { useParams } from 'next/navigation'

export default function CentroCustoListingPage() {
  try {
    const { slug } = useParams<{ slug: string }>()
    const { 
      searchQuery,
      page,
      orderBy,
      order,
      ativo
    } = useCentroCustoTableFilters();
    
    const { data: responseData, error, isLoading } = useCentrosCusto(slug!, {
      search: searchQuery,
      page,
      orderBy,
      order: order as 'asc' | 'desc',
      ativo: ativo ? (ativo === 'true') : undefined,
      limit: 10
    });

    const { centros = [], total = 0 } = responseData ?? { centros: [], total: 0 };
    
    if (isLoading) return <div>Carregando...</div>;
    
    if (error) {
      console.error('Erro ao buscar centros de custo:', error);
      return <div>Erro ao carregar centros de custo</div>;
    }
      
    return (
      <div className="space-y-4">
        <CentroCustoTableAction />
        <DataTable
          columns={columns}
          data={centros}
          totalItems={total}
          page={page}
          pageSizeOptions={[10, 20, 30, 40, 50]}
        />
      </div>
    );
    
  } catch (error) {
    console.error('Erro ao buscar centros de custo:', error);
    return <div>Erro interno do servidor</div>;
  }
}
