'use client'

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { convertToCSV, downloadCSV, formatData } from "@/lib/utils";
import { SheetIcon } from "lucide-react";
import { PessoaType, LicencaExportData, RawLicenca } from "types";

export function ExportButtonCsvLicenca({ data }: { data: any }) {
  const pessoas = data?.map(({ licencas, ...rest }: any) => rest);
  const licencas = data?.flatMap((empresa: PessoaType) => empresa.licencas);
  const licencaPessoa = licencas?.map((licenca: any) => {
    const pessoa = pessoas.find((pessoa: any) => pessoa.id === licenca.pessoaId);
    return {
      ...licenca,
      pessoa,
    };
  });
  const isMobile = useIsMobile();
  
  const parsed: LicencaExportData[] = licencaPessoa?.map((licenca: RawLicenca) => {
    return {
      Numero: licenca.numeroLicenca,
      Tipo: licenca.tipoLicenca?.descricao ?? '-',
      pessoa: licenca.pessoa?.juridica?.nomeFantasia ?? '-',
      Emissao: formatData({ data: licenca.dataEmissao }),
      Validade: formatData({ data: licenca.dataValidade }),
    };
  });
  const handleExport = async () => {
    const csv = convertToCSV(parsed);
    downloadCSV(csv, 'condicionantes.csv');
  };

  return (
    <Button
        variant='outline'
      onClick={handleExport}
    >
      <SheetIcon className='h-6 w-6' />
      {
        !isMobile && (<span className='ml-2'>Exportar CSV</span>)
      }
    </Button>
  );
}