'use client'

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

interface RelatorioExtratoPrintProps {
  data: RelatorioData
}

export function RelatorioExtratoPrint({ data }: RelatorioExtratoPrintProps) {
  let saldoAtual = data.saldo_anterior

  return (
    <div className="print-container hidden print:block">
      <style jsx>{`
        @media print {
          .print-container {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @page {
          margin: 2cm;
        }
        .print-header {
          border-bottom: 2px solid #000;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        .print-footer {
          border-top: 2px solid #000;
          padding-top: 1rem;
          margin-top: 1rem;
          text-align: center;
          font-size: 0.75rem;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #ddd;
          padding: 0.25rem;
          text-align: left;
        }
        .print-table th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .print-table .text-right {
          text-align: right;
        }
      `}</style>

      <div className="print-header">
        <h1 className="text-2xl font-bold mb-2">Relatório de Extrato</h1>
        <p className="text-sm">
          Gerado em: {new Date().toLocaleDateString('pt-BR')} às{' '}
          {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      <div className="mb-4 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold">Saldo anterior:</p>
            <p className="text-lg">{formatCurrency(data.saldo_anterior)}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Saldo final:</p>
            <p className="text-lg">{formatCurrency(data.saldo_final)}</p>
          </div>
        </div>
      </div>

      <table className="print-table text-xs">
        <thead>
          <tr>
            <th>Data</th>
            <th>Código</th>
            <th>Classificação</th>
            <th>Pessoa</th>
            <th>Descrição</th>
            <th className="text-right">Valor</th>
            <th className="text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <td colSpan={6} style={{ fontWeight: 600 }}>
              Saldo anterior:
            </td>
            <td className="text-right" style={{ fontWeight: 600 }}>
              {formatCurrency(data.saldo_anterior)}
            </td>
          </tr>
          {data.lancamentos.map((lanc) => {
            if (lanc.tipo === 'RECEITA') {
              saldoAtual += lanc.valor
            } else if (lanc.tipo === 'DESPESA') {
              saldoAtual -= lanc.valor
            }

            return (
              <tr key={lanc.id}>
                <td>{formatDate(lanc.data)}</td>
                <td>{lanc.numero}</td>
                <td>{lanc.categoria?.nome || '---'}</td>
                <td>{lanc.parceiro_nome || '---'}</td>
                <td>{lanc.descricao}</td>
                <td className="text-right">
                  {lanc.tipo === 'DESPESA' ? '-' : '+'}
                  {formatCurrency(Math.abs(lanc.valor))}
                </td>
                <td className="text-right" style={{ fontWeight: 600 }}>
                  {formatCurrency(saldoAtual)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="print-footer">
        <p>Relatório gerado automaticamente pelo sistema</p>
      </div>
    </div>
  )
}
