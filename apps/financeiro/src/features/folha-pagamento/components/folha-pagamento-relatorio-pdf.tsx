'use client'

import { BlobProvider, Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { FileText } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/export-utils'

const tipoFolhaLabels: Record<string, string> = {
  FOLHA_MENSAL: 'Folha de pagamento',
  FERIAS: 'Férias',
  DECIMO_TERCEIRO: '13º Salário',
  RESCISAO: 'Rescisão',
}

const naturezaLabels: Record<string, string> = {
  PROVENTO: 'Provento',
  DESCONTO: 'Desconto',
  ENCARGO: 'Encargo',
}

function funcionarioLabel(funcionario: any) {
  return (
    funcionario?.pessoa?.fisica?.nome ??
    funcionario?.pessoa?.juridica?.nome_fantasia ??
    funcionario?.matricula ??
    '---'
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    borderBottomStyle: 'solid',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f3f4f6',
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  folhaHeader: {
    marginTop: 10,
    padding: 6,
    backgroundColor: '#e5e7eb',
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 3,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
  },
  colFuncionario: { width: '24%', paddingRight: 4 },
  colRubrica: { width: '22%', paddingRight: 4 },
  colNatureza: { width: '14%', paddingRight: 4 },
  colDescricao: { width: '24%', paddingRight: 4 },
  colValor: { width: '16%', textAlign: 'right' },
  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#111',
    borderTopStyle: 'solid',
    color: '#666',
    textAlign: 'center',
  },
})

function RelatorioDocument({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório da Folha de Pagamento</Text>
          <Text style={styles.subtitle}>
            Gerado em {new Date(data.generated_at).toLocaleString('pt-BR')}
          </Text>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Folhas</Text>
            <Text style={styles.summaryValue}>{data.folhas.length}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Itens</Text>
            <Text style={styles.summaryValue}>{data.totals.total_itens}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Proventos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.totals.total_proventos)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Descontos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.totals.total_descontos)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Encargos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.totals.total_encargos)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Líquido</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.totals.total_liquido)}</Text>
          </View>
        </View>

        {data.folhas.map((folha: any) => (
          <View key={folha.id} wrap={false}>
            <View style={styles.folhaHeader}>
              <Text>
                {folha.competencia} · {tipoFolhaLabels[folha.tipo] ?? folha.tipo} · {folha.status} · Líquido:{' '}
                {formatCurrency(folha.totais_filtrados.total_liquido)}
              </Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.colFuncionario}>Funcionário</Text>
              <Text style={styles.colRubrica}>Rubrica</Text>
              <Text style={styles.colNatureza}>Natureza</Text>
              <Text style={styles.colDescricao}>Descrição</Text>
              <Text style={styles.colValor}>Valor</Text>
            </View>
            {folha.itens.map((item: any) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.colFuncionario}>{funcionarioLabel(item.funcionario)}</Text>
                <Text style={styles.colRubrica}>{item.rubrica?.nome ?? item.tipo}</Text>
                <Text style={styles.colNatureza}>{naturezaLabels[item.natureza] ?? item.natureza}</Text>
                <Text style={styles.colDescricao}>{item.descricao}</Text>
                <Text style={styles.colValor}>{formatCurrency(item.valor)}</Text>
              </View>
            ))}
          </View>
        ))}

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
  onReset,
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
      link.download = `relatorio-folha-pagamento-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => {
        downloadedRef.current = false
        onReset()
      }, 100)
    }
  }, [url, onReset])

  return (
    <Button type="button" variant="outline" disabled={loading} onClick={error ? onReset : undefined}>
      <FileText className="mr-2 h-4 w-4" />
      {loading ? 'Gerando...' : error ? 'Erro ao gerar' : 'Preparando PDF...'}
    </Button>
  )
}

export function FolhaPagamentoRelatorioPDF({ data }: { data: any }) {
  const [shouldGenerate, setShouldGenerate] = useState(false)
  const handleReset = useCallback(() => setShouldGenerate(false), [])

  if (!shouldGenerate) {
    return (
      <Button type="button" variant="outline" onClick={() => setShouldGenerate(true)} disabled={!data?.folhas?.length}>
        <FileText className="mr-2 h-4 w-4" />
        Gerar PDF
      </Button>
    )
  }

  return (
    <BlobProvider document={<RelatorioDocument data={data} />}>
      {({ url, loading, error }) => (
        <PDFDownloadButton url={url} loading={loading} error={error} onReset={handleReset} />
      )}
    </BlobProvider>
  )
}
