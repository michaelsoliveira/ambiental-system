import { Icons } from '@/components/icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { any, literal } from 'zod';

export interface EnderecoType {
  id: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  municipioId: number;
  estadoId: number;
  complemento?: string;
  bairro?: string;
}

export interface CondicionanteType {
  id: string;
  descricao: string;
  tipo: "monitoramento" | "relatorio" | "mitigadora" | "compensatoria" | "legal" | "outro";
  frequencia: "unica" | "periodica" | "eventual" | "continua";
  prazoDias: number;
}

export interface UserType {
  id: string;
  username: string;
  email: string;
  password: string;
  roles: { id: string, name: string }[]
}

export interface EstadoType {
  id: number;
  nome: string;
  uf: string;
  ddd: Array<number>
}

export interface MunicipioType {
  id: number;
  nome: string;
  lat_lon: string;
  estadoId: number;
  estado: EstadoType;
}

export interface PessoaType {
  id?: string;
  tipo?: "F" | "J";
  telefone?: string;
  email?: string;
  enderecoId?: string;
  endereco?: EnderecoType;
  fisica?: PessoaFisicaType;
  juridica?: PessoaJuridicaType;
  licencas?: LicencaType[];
}

export interface LicencaType {
  id: string;
  pessoaId: string;
  numeroLicenca: string;
  tipoLicencaId: string;
  tipoLicenca: TipoLicencaType;
  status: string;
  orgaoEmissor: string;
  dataEmissao: Date;
  dataValidade: Date;
  pessoa?: PessoaType;
}

export interface PessoaJuridicaType {
  id?: string;
  nomeFantasia: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
  inscricaoFederal?: string;
  cnpj?: string;
  dataConstituicao?: string;
  pessoaId?: string;
}

export interface PessoaFisicaType {
  id: string
  nome: string
  rg: string
  cpf: string
  dataNascimento?: string
  pessoaId: string
}

export type CondicionanteFrequenciaType = 'unica' | 'periodica' | 'continua' | 'eventual'

export type VencimentoCondicionante = {
  id: string
  licencaCondicionanteId: string;
  parent?: any;
  mes: number;
  documentos?: any;
  dataAtribuicao?: string
  dataVencimento: string
  dataCumprimento?: string
  status: 'pendente' | 'concluida' | 'atrasada' | 'em_andamento'
  diasRestantes: number
  observacao?: string,
}

export type RawLicenca = {
  numeroLicenca: string;
  dataEmissao: string;
  dataValidade: string;
  tipoLicenca?: {
    nome: string;
    descricao: string;
  };
  pessoa?: {
    fisica?: {
      nome: string;
    }
    juridica?: {
      nomeFantasia?: string;
    }
  };
};

export type LicencaExportData = {
  numero: string;
  tipo: string;
  pessoa: string;
  emissao: string;
  validade: string;
};

export interface TipoLicencaType {
  id: string;
  nome: string;
  descricao: string;
}

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
