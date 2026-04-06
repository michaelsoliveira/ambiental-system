'use client'

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';

import { CategoriaButton } from '../categoria-button';

interface Categoria {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  tipo: 'RECEITA' | 'DESPESA'
  nivel: number
  parent_id: string | null
  ativo: boolean
  created_at: string
}

export const columns: ColumnDef<Categoria>[] = [
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
      const nivel = row.original.nivel
      return (
        <div className="font-medium" style={{ paddingLeft: `${(nivel - 1) * 20}px` }}>
          {row.getValue('nome')}
        </div>
      )
    }
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as string
      return (
        <Badge variant={tipo === 'RECEITA' ? 'default' : 'destructive'}>
          {tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
        </Badge>
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
    cell: ({ row }) => <div className='flex items-center'><CategoriaButton categoriaId={row.original.id} /></div>  
  },
];
