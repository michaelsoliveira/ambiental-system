'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { StatusQuickAction } from './status-quick-action';


export type ColumnsProps = {
  onRowClick?: (row: any) => void;
};

export const getColumns = (onRowClick?: (row: any) => void): ColumnDef<any>[] => [
  {
    id: 'quick-status',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <StatusQuickAction data={row.original} />
      </div>
    ),
    size: 40
  },
  {
    header: 'Parceiro',
    cell: ({ row }) => {
      const pessoa_nome = row.original.parceiro_nome || 'N/A'
      const descricao = row.original.descricao || '';
      const numero = row.original.numero || '';
      
      return (
        <div 
          className="cursor-pointer"
          onClick={() => onRowClick?.(row.original)}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {pessoa_nome}
            </span>
            <span className="font-medium text-muted-foreground">
              {descricao}
            </span>
            {numero && (
              <span className="text-xs text-muted-foreground">
                #{numero}
              </span>
            )}
          </div>
        </div>
      );
    }
  },
  {
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipo || 'N/A';
      const tipoColors = {
        'RECEITA': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'DESPESA': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'TRANSFERENCIA': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
      
      return (
        <Badge className={tipoColors[tipo as keyof typeof tipoColors] || ''}>
          {tipo}
        </Badge>
      );
    }
  },
  {
    header: 'Valor',
    cell: ({ row }) => {
      const valor = row.original.valor || 0;
      const tipo = row.original.tipo;
      const isNegative = tipo === 'DESPESA';
      
      return (
        <div 
          className={`cursor-pointer font-semibold ${
            isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}
          onClick={() => onRowClick?.(row.original)}
        >
          {isNegative ? '-' : '+'} {formatCurrency(valor)}
        </div>
      );
    }
  },
  {
    header: 'Data',
    cell: ({ row }) => {
      const data = row.original.data || null;
      
      return (
        <div 
          className="text-muted-foreground cursor-pointer text-sm"
          onClick={() => onRowClick?.(row.original)}
        >
          {data ? formatDateShort(new Date(data)) : 'N/A'}
        </div>
      );
    }
  },
  {
    header: 'Vencimento',
    cell: ({ row }) => {
      const data_vencimento = row.original.data_vencimento || null;
      const pago = row.original.pago;
      
      return (
        <div 
          className={`text-sm cursor-pointer ${
            pago 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-muted-foreground'
          }`}
          onClick={() => onRowClick?.(row.original)}
        >
          {data_vencimento ? formatDateShort(new Date(data_vencimento)) : 'N/A'}
        </div>
      );
    }
  },
  {
    header: 'Status',
    cell: ({ row }) => {
      const statusLancamento = row.original.status_lancamento || 'PENDENTE';
      const statusColors = {
        'PENDENTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'CONFIRMADO': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'PAGO': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'CANCELADO': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        'ATRASADO': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      };
      
      return (
        <Badge className={statusColors[statusLancamento as keyof typeof statusColors] || ''}>
          {statusLancamento}
        </Badge>
      );
    }
  },
  {
    header: 'Categoria',
    accessorKey: 'categoria',
    cell: ({ row }) => {
      const categoria = row.original.categoria?.nome || '-';
      
      return (
        <span className="truncate text-muted-foreground text-sm group-hover:opacity-0 transition-opacity">
          {categoria}
        </span>
      );
    }
  },
  {
    header: 'Conta',
    id: 'conta',
    cell: ({ row }) => {
      const contaNome = row.original.conta_bancaria?.nome || 'N/A';
      
      return (
        <div className="relative w-full group/cell">
          {/* Texto da conta - visível por padrão */}
          <span className="truncate text-muted-foreground text-sm group-hover:opacity-0 transition-opacity">
            {contaNome}
          </span>
          
          {/* Overlay com ícones - sobrepõe ambas as colunas */}
          <div className="absolute -left-[50px] top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-10">
            <CellAction 
              data={row.original} 
              onEdit={onRowClick}
            />
          </div>
        </div>
      );
    }
  }
];