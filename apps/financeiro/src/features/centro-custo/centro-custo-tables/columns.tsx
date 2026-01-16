'use client'

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CentroCustoButton } from '../centro-custo-button';

interface CentroCusto {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
}

export const columns: ColumnDef<CentroCusto>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => {
      const codigo = row.getValue('codigo') as string
      return (
        <div className="w-24">
          {codigo || '-'}
        </div>
      )
    }
  },
  {
    accessorKey: 'nome',
    header: 'Nome',
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue('nome')}
        </div>
      )
    }
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => {
      const descricao = row.getValue('descricao') as string
      return (
        <div className="max-w-[300px] truncate">
          {descricao || '-'}
        </div>
      )
    }
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => {
      const ativo = row.getValue('ativo') as boolean
      return (
        <Badge variant={ativo ? 'default' : 'secondary'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => <div className='flex items-center'><CentroCustoButton centroCustoId={row.original.id} /></div>  
  },
];
