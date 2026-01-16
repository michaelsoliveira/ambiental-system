// scripts/convert-csv-to-sql.ts
import fs from 'fs';

interface MunicipioRow {
  id: string;
  nome: string;
  estado_id: string;
  ibge: string;
  lat_lon: string;
}

/**
 * Converte formato POINT do CSV para formato PostgreSQL válido
 * De: POINT(-20.0778007507324 -41.1260986328125)
 * Para: (-20.0778007507324,-41.1260986328125)
 */
function convertPointFormat(pointString: string): string {
  // Remove "POINT(" e ")"
  const cleaned = pointString.replace(/POINT\(/, '').replace(/\)/, '').trim();
  // Troca espaço por vírgula
  const converted = cleaned.replace(/\s+/, ',');
  // Retorna entre parênteses
  return `(${converted})`;
}

/**
 * Converte CSV com POINT para SQL INSERT
 */
function convertCsvToSql(
  csvFilePath: string,
  outputFilePath: string
): void {
  try {
    // Ler arquivo CSV
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    // Pular header
    const dataLines = lines.slice(1);

    // Converter cada linha
    const insertStatements: string[] = [];

    dataLines.forEach((line) => {
      // Split por semicolon
      const [id, nome, estado_id, ibge, lat_lon] = line.split(';');

      if (!id || !nome) return; // Skip linhas vazias

      // Converter POINT
      const pointConverted = lat_lon ? convertPointFormat(lat_lon.trim()) : 'NULL';

      // Escapar aspas simples no nome
      const nomeSafe = nome.replace(/'/g, "''");

      // Criar INSERT statement
      const sql = `INSERT INTO common.municipios (id, nome, estado_id, ibge, lat_lon) VALUES (${id}, '${nomeSafe}', ${estado_id}, ${ibge || 'NULL'}, '${pointConverted}'::point);`;

      insertStatements.push(sql);
    });

    // Escrever arquivo SQL
    const sqlContent = insertStatements.join('\n');
    fs.writeFileSync(outputFilePath, sqlContent, 'utf-8');

    console.log(`✅ Arquivo SQL gerado: ${outputFilePath}`);
    console.log(`📊 Total de registros: ${insertStatements.length}`);
  } catch (error) {
    console.error('❌ Erro ao converter CSV:', error);
    process.exit(1);
  }
}

// Uso
const csvPath = process.argv[2] || './municipios.csv';
const sqlPath = process.argv[3] || './municipios.sql';

convertCsvToSql(csvPath, sqlPath);

// ===== ALTERNATIVA: Converter CSV diretamente para novo CSV válido =====

/**
 * Converte CSV com POINT para novo CSV com ponto válido
 */
function convertCsvFormat(
  inputCsvPath: string,
  outputCsvPath: string
): void {
  try {
    const csvContent = fs.readFileSync(inputCsvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    // Manter header
    const header = lines[0];
    const dataLines = lines.slice(1);

    // Converter cada linha
    const convertedLines = dataLines.map((line) => {
      const [id, nome, estado_id, ibge, lat_lon] = line.split(';');

      if (!lat_lon) return line;

      // Converter POINT: POINT(-20.0778 -41.1260) → (-20.0778,-41.1260)
      const pointConverted = convertPointFormat(lat_lon.trim());

      return `${id};${nome};${estado_id};${ibge};${pointConverted}`;
    });

    // Escrever novo CSV
    const newCsvContent = [header, ...convertedLines].join('\n');
    fs.writeFileSync(outputCsvPath, newCsvContent, 'utf-8');

    console.log(`✅ CSV convertido: ${outputCsvPath}`);
    console.log(`📊 Total de registros: ${convertedLines.length}`);
  } catch (error) {
    console.error('❌ Erro ao converter CSV:', error);
    process.exit(1);
  }
}

// export para usar em outro lugar
export { convertCsvToSql, convertCsvFormat, convertPointFormat };