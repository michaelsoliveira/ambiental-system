'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { LicencaDetailPdf } from './pdf/licenca-detail-pdf';
import { useLicencaCondicionantes } from '@/hooks/use-licenca-condicionantes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { VencimentoCondicionante } from 'types';
import { Carlito } from 'next/font/google';
import { cn, formatCnpj, formatCpf } from '@/lib/utils';

interface LicencaDetailsProps {
  licenca: any;
  onClose?: () => void;
}

const carlito = Carlito({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap'
});

const borderColor = 'border-[#808080]';
const tableBorder = `border ${borderColor}`;
const tableHeaderCell = `flex flex-row bg-[#f7f7f7] border-r ${borderColor} px-1 items-center`;
const tableDataCell = `flex flex-row  border-r ${borderColor} px-1 items-center`;
const sectionTitle = `flex flex-row items-center justify-center w-full px-1 bg-[#ddd] border-l border-r border-t ${borderColor}`;

export function LicencaDetails({ licenca, onClose }: LicencaDetailsProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const { data: dataLC } = useLicencaCondicionantes(licenca?.id, {});
  const { data: licencaCondicionantes } = dataLC ?? { data: [], total: 0 };

  const imprimir = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `LIC-${licenca.id?.slice(0, 6)}`,
    pageStyle: `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          margin: 4mm 5mm 10mm 5mm;
        }
        body {
          background-color: white !important;
        }
      }
    `,
  });

  const dataEmissao = format(new Date(licenca.dataEmissao), 'dd/MM/yyyy', { locale: ptBR });
  const validade = format(new Date(licenca.dataValidade), 'dd/MM/yyyy', { locale: ptBR });
  const dataAtual = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });

  const nomePessoa = licenca?.pessoa.tipo === 'F' ? licenca?.pessoa?.fisica?.nome : licenca?.pessoa?.juridica?.nomeFantasia || 'Nome não informado';
  const cpf_cnpj = licenca?.pessoa.tipo === 'F' ? formatCpf(licenca?.pessoa?.fisica?.cpf) : formatCnpj(licenca?.pessoa?.juridica?.cnpj) || 'Documento não informado';

  return (
    <div className="p-4 space-y-4">
      <div className="max-h-[70vh] overflow-y-auto border rounded-md scroll-hidden px-8 bg-black/70">
        <div ref={componentRef} className={cn(carlito.className, "bg-white p-1 text-sm h-full z-30 px-8")}>
          <div className="flex flex-col items-center justify-center space-y-1 mt-6">
            <div className='mb-6'>
              <Image src="/images/logo_ambiental.png" alt="Logo Ambiental" width={640/4} height={295/4} />
            </div>
            <div className={`w-full border ${borderColor} bg-[#ddd]`}>
              <h2 className="text-center font-bold text-lg py-1">
                {licenca.tipoLicenca?.descricao?.toUpperCase()}
              </h2>
            </div>
          </div>

          {/* Dados principais da licença */}
          <div className={`grid grid-cols-5 border-l border-r border-b ${borderColor}`}>
            <div className={cn(tableHeaderCell, 'border-b')}><strong>Nº da Licença:</strong></div>
            <div className={(`border-b col-span-2 ${tableDataCell}`)}>{licenca.numeroLicenca}</div>
            <div className={`border-b ${tableHeaderCell}`}><strong>Data de Emissão:</strong></div>
            <div className={`border-b ${borderColor} p-1`}>{dataEmissao}</div>

            <div className={`border-b ${tableHeaderCell}`}><strong>Tipo:</strong></div>
            <div className={`border-b col-span-2 ${tableDataCell}`}>{licenca.tipoLicenca?.descricao}</div>
            <div className={`border-b ${tableHeaderCell}`}><strong>Validade:</strong></div>
            <div className={`border-b ${borderColor} p-1`}>{validade}</div>

            <div className={tableHeaderCell}><strong>Responsável:</strong></div>
            <div className={`col-span-2 ${tableDataCell}`}>{nomePessoa}</div>
            <div className={tableHeaderCell}><strong>{licenca?.pessoa.tipo === 'F' ? 'CPF' : 'CNPJ'}:</strong></div>
            <div className={`p-1 ${borderColor}`}>{cpf_cnpj}</div>
          </div>

          {/* Título Condicionantes */}
          <div className={cn(sectionTitle, 'mt-4')}>
            <span className="text-center font-bold text-lg py-1">Condicionantes</span>
          </div>

          {/* Lista de Condicionantes */}
          <div>
            <div className={`${tableBorder} divide-y divide-[#808080]`}>
              {licencaCondicionantes?.map((lc: any) => (
                <div key={lc.id}>
                  <div className="font-bold p-2">
                    {lc.condicionante?.descricao}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow className={`bg-[#ddd] border-b border-t ${borderColor}`}>
                        <TableHead className={cn(`pl-2 font-bold text-[#333] border-r text-center ${borderColor}`, 'h-8')}>Vencimento</TableHead>
                        <TableHead className={cn(`font-bold text-[#333] border-r text-center ${borderColor}`, 'h-8')}>Situação</TableHead>
                        <TableHead className={cn(`font-bold text-[#333] border-r text-center ${borderColor}`, 'h-8')}>Protocolado</TableHead>
                        <TableHead className={cn("font-bold text-[#333] text-center h-8")}>Dias Restantes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lc.vencimentos?.map((venc: VencimentoCondicionante, idx: number) => (
                        <TableRow key={venc.id} className={cn(borderColor, 'py-1', idx % 2 === 0 && 'bg-[#f7f7f7]')}>
                          <TableCell className={cn(`pl-2 border-r text-center ${borderColor}`, 'py-1')}>
                            {format(new Date(venc.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className={cn(`border-r ${borderColor} text-center`, 'py-1')}>{venc.status}</TableCell>
                          <TableCell className={cn(`pl-2 border-r text-center ${borderColor}`, 'py-1')}>
                            {venc.dataCumprimento ? format(new Date(venc.dataCumprimento), 'dd/MM/yyyy', { locale: ptBR }) : ' - '}
                          </TableCell>
                          <TableCell className='py-1 text-center'>{!venc.dataCumprimento ? venc.diasRestantes : ' - '}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>

          <p className="text-right text-sm mt-8">
            Macapá-AP, {dataAtual}.
          </p>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-row items-center justify-between">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
        <div className="flex flex-row justify-end space-x-2">
          <PDFDownloadLink
            document={<LicencaDetailPdf licenca={licenca} condicionantes={licencaCondicionantes} />}
            fileName={`LIC-${licenca.id?.slice(0, 6)}.pdf`}
          >
            {({ loading }) =>
              <Button variant="outline">{loading ? 'Gerando PDF...' : 'Exportar PDF'}</Button>
            }
          </PDFDownloadLink>
          <Button onClick={imprimir}>Imprimir</Button>
        </div>
      </div>
    </div>
  );
}
