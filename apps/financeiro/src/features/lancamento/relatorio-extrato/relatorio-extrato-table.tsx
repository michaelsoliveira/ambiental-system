'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/export-utils'

interface RelatorioData {
  lancamentos: Array<{
    id: string
    numero: string
    tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    data: string
    descricao: string
    valor: number
    categoria?: { nome: string } | null
    parceiro_nome?: string | null
  }>
  saldo_anterior: number
  saldo_final: number
}

interface RelatorioExtratoTableProps {
  data: RelatorioData
  mostrarSaldoAnterior?: boolean
  periodoLabel?: string
  filtrosAplicados?: string[]
}

export function RelatorioExtratoTable({
  data,
  mostrarSaldoAnterior = true,
  periodoLabel,
  filtrosAplicados,
}: RelatorioExtratoTableProps) {
  let saldoAtual = mostrarSaldoAnterior ? data.saldo_anterior : 0
  const saldoFinalExibido = mostrarSaldoAnterior
    ? data.saldo_final
    : data.saldo_final - data.saldo_anterior

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-4 border-b">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="text-lg font-semibold">Relatório de Extrato</h3>
            {periodoLabel && (
              <p className="text-sm text-muted-foreground">Período: {periodoLabel}</p>
            )}
            {filtrosAplicados && filtrosAplicados.length > 0 && (
              <p className="text-sm text-muted-foreground break-words">
                Filtros: {filtrosAplicados.join(' · ')}
              </p>
            )}
            {mostrarSaldoAnterior && (
              <p className="text-sm text-muted-foreground">
                Saldo anterior: {formatCurrency(data.saldo_anterior)}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground">Saldo final:</p>
            <p className="text-lg font-semibold">{formatCurrency(saldoFinalExibido)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Código do lançamento</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Pessoa</TableHead>
              <TableHead>Descrição do lançamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mostrarSaldoAnterior && (
              <TableRow className="bg-muted/50">
                <TableCell colSpan={6} className="font-medium">
                  Saldo anterior:
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.saldo_anterior)}
                </TableCell>
              </TableRow>
            )}
            {data.lancamentos.map((lanc) => {
              if (lanc.tipo === 'RECEITA') {
                saldoAtual += lanc.valor
              } else if (lanc.tipo === 'DESPESA') {
                saldoAtual -= lanc.valor
              }

              return (
                <TableRow key={lanc.id}>
                  <TableCell>{formatDate(lanc.data)}</TableCell>
                  <TableCell>{lanc.numero}</TableCell>
                  <TableCell>{lanc.categoria?.nome || '---'}</TableCell>
                  <TableCell>{lanc.parceiro_nome || '---'}</TableCell>
                  <TableCell>{lanc.descricao}</TableCell>
                  <TableCell
                    className={`text-right ${
                      lanc.tipo === 'DESPESA' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {lanc.tipo === 'DESPESA' ? '-' : '+'}
                    {formatCurrency(Math.abs(lanc.valor))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(saldoAtual)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
