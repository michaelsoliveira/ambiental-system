'use client';
// import { Product } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { LicencaType, PessoaType } from 'types';
import { CellDate } from './cell-date';
import { Modal } from '@/components/ui/modal';
import { ChevronDown, ChevronRight, EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCnpj, formatCpf } from '@/lib/utils';

// Colunas da tabela principal de empresas
export const empresaColumns: ColumnDef<PessoaType>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      const isOpen = row.getIsExpanded();
      return (
        <Button variant="ghost" size="icon" onClick={() => row.toggleExpanded()}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </Button>
      );
    },
  },
  {
    // accessorKey: "juridica.nomeFantasia",
    header: "Resonsável",
    cell: ({ row }) => {
      const nome = row.original.tipo === 'F' ? row.original.fisica?.nome : row.original.juridica?.nomeFantasia
      return nome
    }
  },
  {
    // accessorKey: "pessoa.juridica.cnpj",
    header: "CPF/CNPJ",
    cell: ({ row }) => {
      const cpf_cnpj = row.original.tipo === 'F' ? formatCpf(row.original.fisica?.cpf!) : formatCnpj(row.original.juridica?.cnpj!)
      return <span className="font-mono text-sm">{cpf_cnpj}</span>;
    },
  },
];

export const licencaColumns: ColumnDef<LicencaType>[] = [
  {
    accessorKey: 'numeroLicenca',
    header: 'Nº Licença',
    cell: ({ row }) => row.original.numeroLicenca
  },
  {
    accessorKey: 'tipoLicenca.descricao',
    header: 'Tipo Licença',
  },
  {
    accessorKey: 'orgaoEmissor',
    header: 'Orgão Emissor',
  },
  {
    accessorKey: 'dataEmissao',
    header: 'Data Emissão',
    cell: ({ row }) => <CellDate data={row.original.dataEmissao} />
  },
  {
    accessorKey: 'dataValidade',
    header: 'Data Validade',
    cell: ({ row }) => <CellDate data={row.original.dataValidade} />
  },
  // {
  //   header: 'Ações',
  //   id: 'actions',
  //   cell: ({ row }) => <div className='flex items-center'><CellDetail row={row} /><CellAction data={row.original} /></div>
  // }
];
