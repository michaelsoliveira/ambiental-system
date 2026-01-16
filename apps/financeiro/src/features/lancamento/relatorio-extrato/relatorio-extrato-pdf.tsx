'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, BlobProvider } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
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

interface RelatorioExtratoPDFProps {
  data: RelatorioData
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 8,
    color: '#666',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  summaryItem: {
    fontSize: 10,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    fontSize: 8,
  },
  tableCell: {
    flex: 1,
  },
  tableCellSmall: {
    flex: 0.8,
  },
  tableCellLarge: {
    flex: 1.5,
  },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
  saldoAnteriorRow: {
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
  },
})

function PDFDocument({ data }: RelatorioExtratoPDFProps) {
  let saldoAtual = data.saldo_anterior

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Extrato</Text>
          <Text style={styles.subtitle}>
            Gerado em: {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR')}
          </Text>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Saldo anterior:</Text>
            <Text style={styles.summaryItem}>{formatCurrency(data.saldo_anterior)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Saldo final:</Text>
            <Text style={styles.summaryItem}>{formatCurrency(data.saldo_final)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellSmall, styles.textCenter]}>Data</Text>
            <Text style={[styles.tableCellSmall, styles.textCenter]}>Código</Text>
            <Text style={styles.tableCell}>Classificação</Text>
            <Text style={styles.tableCell}>Pessoa</Text>
            <Text style={styles.tableCellLarge}>Descrição</Text>
            <Text style={[styles.tableCellSmall, styles.textRight]}>Valor</Text>
            <Text style={[styles.tableCellSmall, styles.textRight]}>Saldo</Text>
          </View>

          <View style={[styles.tableRow, styles.saldoAnteriorRow]}>
            <Text style={[styles.tableCellSmall, styles.textCenter]}>-</Text>
            <Text style={[styles.tableCellSmall, styles.textCenter]}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCellLarge}>Saldo anterior:</Text>
            <Text style={[styles.tableCellSmall, styles.textRight]}>-</Text>
            <Text style={[styles.tableCellSmall, styles.textRight]}>
              {formatCurrency(data.saldo_anterior)}
            </Text>
          </View>

          {data.lancamentos.map((lanc) => {
            if (lanc.tipo === 'RECEITA') {
              saldoAtual += lanc.valor
            } else if (lanc.tipo === 'DESPESA') {
              saldoAtual -= lanc.valor
            }

            return (
              <View key={lanc.id} style={styles.tableRow}>
                <Text style={[styles.tableCellSmall, styles.textCenter]}>
                  {formatDate(lanc.data)}
                </Text>
                <Text style={[styles.tableCellSmall, styles.textCenter]}>{lanc.numero}</Text>
                <Text style={styles.tableCell}>{lanc.categoria?.nome || '---'}</Text>
                <Text style={styles.tableCell}>{lanc.parceiro_nome || '---'}</Text>
                <Text style={styles.tableCellLarge}>{lanc.descricao}</Text>
                <Text style={[styles.tableCellSmall, styles.textRight]}>
                  {lanc.tipo === 'DESPESA' ? '-' : '+'}
                  {formatCurrency(Math.abs(lanc.valor))}
                </Text>
                <Text style={[styles.tableCellSmall, styles.textRight]}>
                  {formatCurrency(saldoAtual)}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={styles.footer}>
          <Text>Relatório gerado automaticamente pelo sistema</Text>
        </View>
      </Page>
    </Document>
  )
}


function PDFDownloadButton({ 
  url, 
  loading, 
  error, 
  onReset 
}: { 
  url: string | null
  loading: boolean
  error: Error | null
  onReset: () => void
}) {
  const downloadedRef = useRef(false)

  useEffect(() => {
    if (url && !downloadedRef.current) {
      downloadedRef.current = true
      const link = document.createElement('a')
      link.href = url
      link.download = `extrato-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => {
        onReset()
        downloadedRef.current = false
      }, 100)
    }
  }, [url, onReset])

  if (loading) {
    return (
      <Button type="button" variant="outline" disabled>
        <FileText className="h-4 w-4 mr-2" />
        Gerando...
      </Button>
    )
  }

  if (error) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
      >
        <FileText className="h-4 w-4 mr-2" />
        Erro ao gerar
      </Button>
    )
  }

  return (
    <Button type="button" variant="outline" disabled>
      <FileText className="h-4 w-4 mr-2" />
      Preparando download...
    </Button>
  )
}

export function RelatorioExtratoPDF({ data }: RelatorioExtratoPDFProps) {
  const [shouldGenerate, setShouldGenerate] = useState(false)

  const handleGeneratePDF = useCallback(() => {
    setShouldGenerate(true)
  }, [])

  const handleReset = useCallback(() => {
    setShouldGenerate(false)
  }, [])

  if (!shouldGenerate) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleGeneratePDF}
      >
        <FileText className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
    )
  }

  return (
    <BlobProvider document={<PDFDocument data={data} />}>
      {({ blob, url, loading, error }) => (
        <PDFDownloadButton
          url={url}
          loading={loading}
          error={error}
          onReset={handleReset}
        />
      )}
    </BlobProvider>
  )
}
