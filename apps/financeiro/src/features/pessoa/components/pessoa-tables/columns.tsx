'use client'

import { ColumnDef } from '@tanstack/react-table';

import { CellAction } from './cell-action';

export type Contato = {
  id: string;
  tipo: 'F' | 'J';
  email: string | null;
  telefone: string | null;
  created_at: string;
  updated_at: string;
  endereco: {
    municipio: string;
    estado: string;
    cep: string;
  } | null;
  fisica: {
    nome: string;
    cpf: string | null;
  } | null;
  juridica: {
    nome_fantasia: string;
    razao_social: string | null;
    cnpj: string | null;
  } | null;
};

export type ColumnsProps = {
  onRowClick?: (row: any) => void;
};

export const getColumns = (onRowClick?: (row: any) => void): ColumnDef<any>[] => [
  {
    accessorKey: 'nome',
    header: 'Nome',
    cell: ({ row }) => {
      const pessoa = row.original;
      if (pessoa.tipo === 'F') {
        return (
          <div 
            onClick={() => onRowClick?.(row.original)}
            className='max-w-[500px] text-wrap cursor-pointer'>
              {pessoa.fisica?.nome || 'N/A'}
          </div>
        )
      } else {
        return (
          <div 
            onClick={() => onRowClick?.(row.original)}
            className='max-w-[500px] text-wrap cursor-pointer'
          >
            {pessoa.juridica?.nome_fantasia || 'N/A'}
          </div>
        )
      }
    },
  },
  {
    header: 'Contato',
    cell: ({ row }) => {
      const telefone = row.original.telefone as string;
      return (
        <div
          className='cursor-pointer'
          onClick={() => onRowClick?.(row.original)}
        >
          {telefone || 'N/A'}
        </div>
      );
    },
  },
  {
    header: 'Cidade/Estado',
    cell: ({ row }) => {
      const endereco = row.original.endereco;
      
      return (
        <div
          className='cursor-pointer'
          onClick={() => onRowClick?.(row.original)}
        >
          {
            endereco ? `${endereco?.municipio_nome}/${endereco?.estado_nome}` : 'N/A'
          }
        </div>
      )
      
    },
  },
  {
    header: 'Data Cadastro',
    id: 'created_at',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      
      return (
        <div className="relative max-w-[200px]">
          {/* Texto da etapa - visível por padrão, oculto no hover */}
          <div className="group-hover:opacity-0 transition-opacity text-muted-foreground text-sm text-wrap">
            {date.toLocaleDateString('pt-BR')}
          </div>
          
          {/* Ícones de ação - ocultos por padrão, visíveis no hover */}
          <div className="absolute inset-0 flex items-center">
            <CellAction data={row.original} />
          </div>
        </div>
      );
    }
  }
];