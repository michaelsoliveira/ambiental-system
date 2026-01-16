'use client'

import Papa from 'papaparse';

interface CSVRow {
  [key: string]: string | number | boolean;
}

function convertToCSV(data: CSVRow[], config?: any): string {
  if (data.length === 0) {
    throw new Error('Data array is empty');
  }

  // Extract column names from the first row (object keys)
  const columns = Object.keys(data[0]);

  // Convert data array to array of arrays
  const dataArray: (string | number | boolean)[][] = [];
  dataArray.push(columns);

  data.forEach((obj) => {
    const values = columns.map((col) => obj[col]);
    dataArray.push(values);
  });

  return Papa.unparse(dataArray, config);
}

export function exportToCSV(data: CSVRow[], filename: string, config?: any): void {
    var csvData = convertToCSV(data, config);
    //var link;
    const encoding = config?.encoding ? config?.encoding : 'iso-8859-1'
    if (csvData == null) return;
    filename = filename || 'export.csv';
    const link = document.createElement('a');
    link.setAttribute('href', `data:text/csv;charset=${encoding},%EF%BB%BF${encodeURI(csvData)}`);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}