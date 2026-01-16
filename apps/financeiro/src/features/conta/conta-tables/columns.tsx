'use client'

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ContaButton } from '../conta-button';

interface Conta {
  id: string
  codigo: string
  nome: string
  tipo_conta: 'BANCARIA' | 'CONTABIL'
  banco: string | null
  agencia: string | null
  numero: string | null
  saldoAtual: number
  ativo: boolean
  created_at: string
}

export const columns: ColumnDef<Conta>[] = [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => {
      const codigo = row.getValue('codigo') as string
      return (
        <div className="w-24 font-medium">
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
    accessorKey: 'tipo_conta',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo_conta') as string
      return (
        <Badge variant="outline">
          {tipo === 'BANCARIA' ? 'Bancária' : 'Contábil'}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'banco',
    header: 'Banco',
    cell: ({ row }) => {
      const banco = row.getValue('banco') as string
      return (
        <div className="max-w-[200px] truncate">
          {banco || '-'}
        </div>
      )
    }
  },
  {
    accessorKey: 'agencia',
    header: 'Agência',
    cell: ({ row }) => {
      const agencia = row.getValue('agencia') as string
      const numero = row.original.numero
      return (
        <div>
          {agencia && numero ? `${agencia} / ${numero}` : agencia || numero || '-'}
        </div>
      )
    }
  },
  {
    accessorKey: 'saldoAtual',
    header: 'Saldo',
    cell: ({ row }) => {
      const saldo = row.getValue('saldoAtual') as number
      const tipo = row.original.tipo_conta
      if (tipo !== 'BANCARIA') return <div>-</div>
      return (
        <div className="text-right font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(saldo)}
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
    cell: ({ row }) => <div className='flex items-center'><ContaButton contaId={row.original.id} /></div>  
  },
];
