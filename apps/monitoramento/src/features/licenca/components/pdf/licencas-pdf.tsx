'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

// Fonte opcional para melhorar a aparência
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
    },
  ],
});

type LicencaPdfData = {
  numero: string;
  tipo: string;
  pessoa: string;
  emissao: string;
  validade: string;
};

interface Props {
  licencas: LicencaPdfData[];
}

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#000',
    borderWidth: 1,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    backgroundColor: '#eee',
    fontWeight: 'bold',
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    flex: 1,
  },
});

export function LicencaPdf({ licencas }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Relatório de Licenças Ambientais</Text>

        <View style={styles.table}>
          <View style={[styles.row, styles.headerCell]}>
            <Text style={styles.cell}>Nº Licença</Text>
            <Text style={styles.cell}>Tipo</Text>
            <Text style={styles.cell}>Pessoa</Text>
            <Text style={styles.cell}>Emissão</Text>
            <Text style={styles.cell}>Validade</Text>
          </View>

          {licencas.map((licenca, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.cell}>{licenca.numero}</Text>
              <Text style={styles.cell}>{licenca.tipo}</Text>
              <Text style={styles.cell}>{licenca.pessoa}</Text>
              <Text style={styles.cell}>{licenca.emissao}</Text>
              <Text style={styles.cell}>{licenca.validade}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
