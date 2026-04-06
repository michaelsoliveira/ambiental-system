'use client'

import { BlobProvider,Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { FileText } from 'lucide-react'
import { useCallback, useEffect, useRef,useState } from 'react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/export-utils'

/**
 * react-pdf não faz overflow-wrap em sequências longas sem espaço; o texto
 * “vaza” para a coluna ao lado. Quebramos em linhas de N caracteres.
 */
function hardWrapForPdf(value: string, maxChars: number): string {
  const s = String(value ?? '')
  if (s.length <= maxChars) return s
  const lines: string[] = []
  for (let i = 0; i < s.length; i += maxChars) {
    lines.push(s.slice(i, i + maxChars))
  }
  return lines.join('\n')
}

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
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
    backgroundColor: '#e5e5e5',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontWeight: 'bold',
    fontSize: 7,
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderBottomStyle: 'solid',
    fontSize: 7,
  },
  /** Larguras fixas (% da linha) evitam sobreposição de colunas no react-pdf */
  colData: { width: '10%', paddingRight: 4, minWidth: 0 },
  colCodigo: { width: '13%', paddingRight: 4, minWidth: 0 },
  colClassif: { width: '14%', paddingRight: 4, minWidth: 0 },
  colPessoa: { width: '14%', paddingRight: 4, minWidth: 0 },
  colDesc: { width: '25%', paddingRight: 4, minWidth: 0 },
  colValor: { width: '12%', paddingRight: 4, minWidth: 0 },
  colSaldo: { width: '12%', paddingLeft: 2, minWidth: 0 },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  cellText: {
    fontSize: 7,
    /** obrigatório para o motor de texto respeitar a largura da coluna */
    width: '100%',
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
            <View style={styles.colData}>
              <Text style={[styles.cellText, styles.textCenter]}>Data</Text>
            </View>
            <View style={styles.colCodigo}>
              <Text style={[styles.cellText, styles.textCenter]}>Código</Text>
            </View>
            <View style={styles.colClassif}>
              <Text style={styles.cellText}>Classificação</Text>
            </View>
            <View style={styles.colPessoa}>
              <Text style={styles.cellText}>Pessoa</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.cellText}>Descrição</Text>
            </View>
            <View style={styles.colValor}>
              <Text style={[styles.cellText, styles.textRight]}>Valor</Text>
            </View>
            <View style={styles.colSaldo}>
              <Text style={[styles.cellText, styles.textRight]}>Saldo</Text>
            </View>
          </View>

          <View style={[styles.tableRow, styles.saldoAnteriorRow]}>
            <View style={styles.colData}>
              <Text style={[styles.cellText, styles.textCenter]}>-</Text>
            </View>
            <View style={styles.colCodigo}>
              <Text style={[styles.cellText, styles.textCenter]}>-</Text>
            </View>
            <View style={styles.colClassif}>
              <Text style={styles.cellText}>-</Text>
            </View>
            <View style={styles.colPessoa}>
              <Text style={styles.cellText}>-</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.cellText}>Saldo anterior:</Text>
            </View>
            <View style={styles.colValor}>
              <Text style={[styles.cellText, styles.textRight]}>-</Text>
            </View>
            <View style={styles.colSaldo}>
              <Text style={[styles.cellText, styles.textRight]}>
                {formatCurrency(data.saldo_anterior)}
              </Text>
            </View>
          </View>

          {data.lancamentos.map((lanc) => {
            if (lanc.tipo === 'RECEITA') {
              saldoAtual += lanc.valor
            } else if (lanc.tipo === 'DESPESA') {
              saldoAtual -= lanc.valor
            }

            return (
              <View key={lanc.id} style={styles.tableRow}>
                <View style={styles.colData}>
                  <Text style={[styles.cellText, styles.textCenter]} wrap>
                    {formatDate(lanc.data)}
                  </Text>
                </View>
                <View style={styles.colCodigo}>
                  <Text style={[styles.cellText, styles.textCenter]} wrap>
                    {hardWrapForPdf(lanc.numero, 12)}
                  </Text>
                </View>
                <View style={styles.colClassif}>
                  <Text style={styles.cellText} wrap>
                    {lanc.categoria?.nome || '---'}
                  </Text>
                </View>
                <View style={styles.colPessoa}>
                  <Text style={styles.cellText} wrap>
                    {lanc.parceiro_nome || '---'}
                  </Text>
                </View>
                <View style={styles.colDesc}>
                  <Text style={styles.cellText} wrap>
                    {lanc.descricao}
                  </Text>
                </View>
                <View style={styles.colValor}>
                  <Text style={[styles.cellText, styles.textRight]} wrap>
                    {lanc.tipo === 'DESPESA' ? '-' : '+'}
                    {formatCurrency(Math.abs(lanc.valor))}
                  </Text>
                </View>
                <View style={styles.colSaldo}>
                  <Text style={[styles.cellText, styles.textRight]} wrap>
                    {formatCurrency(saldoAtual)}
                  </Text>
                </View>
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
