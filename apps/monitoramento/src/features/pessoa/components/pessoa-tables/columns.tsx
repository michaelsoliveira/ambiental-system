'use client';
// import { Product } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { PessoaType } from 'types';

export const columns: ColumnDef<PessoaType>[] = [
  {
    header: 'Nome',
    cell: ({ row }) => row.original?.tipo === 'F' ? row.original?.fisica?.nome : row.original?.juridica?.nomeFantasia
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone'
  },
  {
    header: 'Ações',
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
