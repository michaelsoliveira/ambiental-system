'use client'

import { useParams } from 'next/navigation'

import { DataTable } from '@/components/ui/table/data-table';
import { useCategorias } from '@/hooks/use-categoria';

import CategoriaTableAction from './categoria-tables/categoria-table-action';
import { columns } from './categoria-tables/columns';
import { useCategoriaTableFilters } from './categoria-tables/use-categoria-table-filters';

export default function CategoriaListingPage() {
    const { slug } = useParams<{ slug: string }>()
    const {
      searchQuery,
      page,
      limit,
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
      limit
    });

    const { categorias = [], total = 0 } = responseData ?? { categorias: [], total: 0 };
      
    return (
      <>
        
        <div className="space-y-4">
          <CategoriaTableAction />
          {isLoading ? <div>Carregando...</div> : (
          error ? <div>Erro ao carregar categorias</div> : (
            <div className="space-y-4">
            <DataTable
              columns={columns}
              data={categorias}
              totalItems={total}
              page={page}
              pageSizeOptions={[50, 100, 200, 500]}
            />
            </div>
          ))}
        </div>
    </>
  );
}
