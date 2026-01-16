'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { LicencaPdf } from './licencas-pdf';
import { buttonVariants } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn, formatData } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { PessoaType, LicencaExportData, RawLicenca } from 'types';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image'

export default function ExportLicencaPdfButton() {
  const [data, setData] = useState<LicencaExportData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { client } = useAuthContext();
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    try {
      const response = await client.get('/licenca/list-all');
      const { data, error } = response.data ;
      const pessoas = data?.map(({ licencas, ...rest }: any) => rest);
      const licencas = data?.flatMap((pessoa: PessoaType) => pessoa.licencas);
      const licencasPessoa = licencas?.map((licenca: any) => {
        const pessoa = pessoas?.find((pessoa: any) => pessoa.id === licenca.pessoaId);
        return {
          ...licenca,
          pessoa,
        };
      });
      
      const parsed: LicencaExportData[] = licencasPessoa?.map((licenca: RawLicenca) => {
        return {
          numero: licenca.numeroLicenca,
          tipo: licenca.tipoLicenca?.descricao ?? '-',
          pessoa: licenca.pessoa?.juridica?.nomeFantasia ?? '-',
          emissao: formatData({ data: licenca.dataEmissao }),
          validade: formatData({ data: licenca.dataValidade }),
        };
      });

      setData(parsed);
    } catch (e) {
      console.error('Erro ao buscar dados das licenças:', e);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) return null;

  return (
    <PDFDownloadLink
      document={<LicencaPdf licencas={data} />}
      fileName="relatorio_licencas.pdf"
      className={cn(buttonVariants({ variant: 'outline' }), 'text-xs md:text-sm')}
    >
      {({ loading }) => (
        <>
          {/* <Download className="h-4 w-4" /> */}
          <div style={{ position: "relative", width: 18, height: 18 }}>
            <Image
              src="/pdf-icon.svg"
              alt="pdf-icon-licencas"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          {
            // loading ? 'Gerando PDF...' : 'Exportar PDF'
            !isMobile && (<span className='ml-2'>Exportar PDF</span>)
          }
        </>
      )}
    </PDFDownloadLink>
  );
}
