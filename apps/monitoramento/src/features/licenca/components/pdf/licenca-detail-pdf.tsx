import { formatCnpj, formatCpf } from '@/lib/utils';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';

// Registra a fonte Carlito
Font.register({
  family: 'Carlito',
  fonts: [
    { src: '/fonts/Carlito-Regular.ttf' },
    { src: '/fonts/Carlito-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Carlito-Italic.ttf', fontStyle: 'italic' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 11,
    fontFamily: 'Carlito',
    marginBottom: 20
  },
  header: {
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  logo: {
    width: 115,
    height: 60,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    paddingVertical: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#ccc',
    borderRightWidth: 0.5, 
    borderLeftWidth: 0.5, 
    borderTopWidth: 0.5, 
    borderColor: '#333'
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  tableRowEven: {
    backgroundColor: '#f7f7f7'
  },
  tableRowOdd: {
    backgroundColor: '#ffffff'
  },
  cellHeader: {
    flex: 1,
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: '#333',
    justifyContent: 'center',
  },
  cell: {
    flex: 1,
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: '#333',
    justifyContent: 'center',
    textAlign: 'center',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  label: {
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  footer: {
    marginTop: 40,
    fontSize: 12,
    textAlign: 'right',
  },
});

export function LicencaDetailPdf({ licenca, condicionantes }: { licenca: any, condicionantes: any }) {
  const tipoLicenca = licenca.tipoLicenca.descricao;
  const dataEmissao = format(new Date(licenca.dataEmissao), 'dd/MM/yyyy', { locale: ptBR });
  const dataValidade = format(new Date(licenca.dataValidade), 'dd/MM/yyyy', { locale: ptBR });
  const dataAtual = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
  const nomePessoa = licenca?.pessoa.tipo === 'F' ? licenca?.pessoa?.fisica?.nome : licenca?.pessoa?.juridica?.nomeFantasia || 'Empresa não informada';
  const cpf_cnpj = licenca?.pessoa.tipo === 'F' ? formatCpf(licenca?.pessoa?.fisica?.cpf) : formatCnpj(licenca?.pessoa?.juridica?.cnpj) || 'Documento não informado';

  return (
    <Document style={{ fontFamily: 'Calibri, sans-serif' }}>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src="/images/logo_ambiental.png" style={[styles.logo, { marginBottom: 8 }]} />
        </View>

        {/* Título */}
        <Text style={styles.title}>{tipoLicenca.toUpperCase()}</Text>

        {/* Tabela de dados principais */}
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cellHeader, { backgroundColor: '#f7f7f7' }]}><Text style={styles.label}>Licença Nº:</Text></View>
            <View style={[styles.cellHeader, { flex: 2.75 }]}><Text>{licenca.numeroLicenca}</Text></View>
            <View style={[styles.cellHeader, { backgroundColor: '#f7f7f7' }]}><Text style={styles.label}>Data de Emissão:</Text></View>
            <View style={[styles.cellHeader, styles.lastCell]}><Text>{dataEmissao}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cellHeader, { backgroundColor: '#f7f7f7' }]}><Text style={styles.label}>Tipo:</Text></View>
            <View style={[styles.cellHeader, { flex: 2.75 }]}><Text>{licenca.tipoLicenca?.descricao}</Text></View>
            <View style={[styles.cellHeader, { backgroundColor: '#f7f7f7' }]}><Text style={styles.label}>Data de Validade:</Text></View>
            <View style={[styles.cellHeader, styles.lastCell]}><Text>{dataValidade}</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cellHeader, { backgroundColor: '#f7f7f7' }]}><Text style={styles.label}>Responsável:</Text></View>
            <View style={[styles.cellHeader, { flex: 2.75 }]}><Text>{nomePessoa}</Text></View>
            <View style={[styles.cellHeader, { backgroundColor: '#f7f7f7' }]}><Text style={styles.label}>{licenca?.pessoa.tipo === 'F' ? 'CPF' : 'CNPJ'}:</Text></View>
            <View style={[styles.cellHeader, styles.lastCell]}><Text>{cpf_cnpj}</Text></View>
          </View>
        </View>

        {/* Condicionantes e Vencimentos */}
        <View style={styles.section}>
          <Text style={[styles.label, { backgroundColor: '#ccc', paddingVertical: 4, fontSize: 13, textAlign: 'center', borderRightWidth: 0.5, borderLeftWidth: 0.5, borderTopWidth: 0.5, borderColor: '#333' }]}>Condicionantes</Text>

          <View style={styles.table}>
            {condicionantes.map((cond: any, index: number) => {
              const vencs = cond.vencimentos || [];

              return (
                <View key={`cond-group-${index}`}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, padding: 6, marginTop: 6 }}>
                    {cond.condicionante?.descricao}
                  </Text>

                  {/* Cabeçalho da tabela */}
                  <View style={[styles.row, { backgroundColor: '#ddd', borderTop: 0.5 }]}>
                    <View style={[styles.cell, { flex: 2 }]}>
                      <Text style={styles.label}>Vencimento</Text>
                    </View>
                    <View style={[styles.cell, { flex: 2 }]}>
                      <Text style={styles.label}>Situação</Text>
                    </View>
                    <View style={[styles.cell, { flex: 2 }]}>
                      <Text style={styles.label}>Protocolado</Text>
                    </View>
                    <View style={[styles.cell, { flex: 2 }, styles.lastCell]}>
                      <Text style={styles.label}>Dias Restantes</Text>
                    </View>
                  </View>

                  {/* Linhas de vencimento */}
                  {vencs.map((venc: any, idx: number) => {
                    const isRowEven = idx % 2 === 0;
                    return (
                      <View
                        key={`cond-${index}-venc-${idx}`}
                        style={[
                          styles.row,
                          isRowEven ? styles.tableRowEven : styles.tableRowOdd,
                        ]}
                        wrap={false}
                      >
                        <View style={[styles.cell, { flex: 2 }]}>
                          <Text>{format(new Date(venc.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                        </View>
                        <View style={[styles.cell, { flex: 2 }]}>
                          <Text>{venc.status}</Text>
                        </View>
                        <View style={[styles.cell, { flex: 2 }]}>
                          <Text>{venc.dataCumprimento ? format(new Date(venc.dataCumprimento), 'dd/MM/yyyy', { locale: ptBR }) : ' - '}</Text>
                        </View>
                        <View style={[styles.cell, { flex: 2 }, styles.lastCell]}>
                          <Text>{!venc.dataCumprimento ? venc.diasRestantes : ' - '}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.footer}>Macapá-AP, {dataAtual}</Text>

      </Page>
    </Document>
  );
}
