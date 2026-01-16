import { Badge } from '@/components/ui/badge'
import { formatData, toDateString } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'
import { format, toDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { VencimentoCondicionante } from 'types'
import { CellSubAction } from './cell-sub-action'

export const vencimentoColumns: ColumnDef<VencimentoCondicionante>[] = [
  {
    accessorKey: 'mes',
    header: 'Mês',
    cell: ({ row }) =>
    (
      <div className='flex items-center justify-center'>
        { format(new Date(2024, row.original.mes - 1), 'MMMM', { locale: ptBR }) }
      </div>
    )
  },
  {
    accessorKey: 'dataVencimento',
    header: 'Vencimento',
    cell: ({ row }) => (
        <div className='flex items-center justify-center'>
        { new Date(row.original.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) }
        </div>
    )
  },
  {
      accessorKey: 'dataCumprimento',
      header: 'Cumprimento',
      cell: ({ row }) =>(
        <div className='flex items-center justify-center'>
          { 
            row.original.dataCumprimento
            ? new Date(row.original.dataCumprimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : <span className="text-muted-foreground italic">Não Cumprida</span>
          }
        </div>)
    },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const statusColor =
        status === 'concluida'
          ? 'border-green-500 text-green-700'
          : status === 'atrasada'
            ? 'border-red-500 text-red-700'
            : 'border-yellow-500 text-yellow-700'
      return (
        <div className='flex items-center justify-center'>
          <Badge variant="outline" className={statusColor}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </Badge>
        </div>
      )
    }
  },
  {
    accessorKey: 'diasRestantes',
    header: 'Dias Restantes',
    cell: ({ row }) => (<div className='flex justify-center items-center w-full'>{row.original.dataCumprimento ? ' - ' : row.original.diasRestantes}</div>)
  },
  {
      id: 'actions',
      header: () => <div className="text-center w-full">Ações</div>,
      cell: ({ row }) => (
        <div className="flex justify-center items-center w-full">
          <CellSubAction index={row.index} data={row.original} />
        </div>
      ),  
  }
]
