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
    size: 240,
    cell: ({ row }) => {
      const codigo = row.getValue('codigo') as string
      return (
        <div className="break-all text-wrap">
          {codigo || '-'}
        </div>
      )
    }
  },
  {
    accessorKey: 'nome',
    header: 'Nome',
    size: 280,
    cell: ({ row }) => {
      const nivel = row.original.nivel
      return (
        <div className="font-medium break-words text-wrap" style={{ paddingLeft: `${(nivel - 1) * 20}px` }}>
          {row.getValue('nome')}
        </div>
      )
    }
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    size: 110,
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
    size: 220,
    cell: ({ row }) => {
      const descricao = row.getValue('descricao') as string
      return (
        <div className="break-words text-wrap">
          {descricao || '-'}
        </div>
      )
    }
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    size: 100,
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
    size: 80,
    cell: ({ row }) => <div className='flex items-center'><CategoriaButton categoriaId={row.original.id} /></div>
  },
];
