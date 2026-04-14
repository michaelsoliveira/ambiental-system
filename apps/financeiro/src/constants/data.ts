import { NavItem } from "@/types";

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export const PAGE_WIDTH = 816;   // px = 21cm
export const PAGE_HEIGHT = 1056; // px = 29.7cm

const baseNavItems: Array<NavItem> = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    org: true,
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Pessoas',
    url: '/pessoa',
    org: true,
    icon: 'user',
    isActive: true,
  },
  {
    title: 'Parceiros',
    org: true,
    url: '/parceiro',
    icon: 'folder',
  },
  {
    title: 'Funcionários',
    org: true,
    url: '/funcionario',
    icon: 'employee',
  },
  {
    title: 'Financeiro',
    url: '#',
    icon: 'dollar',
    org: true,
    items: [
      {
        title: 'Lançamentos',
        url: '/lancamento',
      },
      {
        title: 'Folha de Pagamento',
        url: '/folha-pagamento',
      },
      {
        title: 'Relatório de Financeiro',
        url: '/lancamentos/relatorio-extrato',
      },
      {
        title: 'Frota',
        url: '/frota',
      },
    ]
  },
  {
    title: 'Configurações',
    // org: true,
    url: '#',
    icon: 'settings',
    external: true,
    items: [
      {
        title: 'Contas',
        org: true,
        url: '/contas',
        icon: 'currency',
      },
      {
        title: 'Centros de Custo',
        org: true,
        url: '/centros-custo',
        icon: 'folder',
      },
      {
        title: 'Categorias',
        org: true,
        url: '/categorias',
        icon: 'folder',
      },
      {
        title: 'Empresas',
        org: true,
        url: '/empresas',
        icon: 'folder',
      },
      {
        title: 'Cargos',
        org: true,
        url: '/cargos-funcionario',
        icon: 'folder',
      },
      {
        title: 'Membros',
        org: true,
        url: '/members',
        icon: 'group',
      },
      {
        title: 'Parâmetros',
        org: true,
        url: '/settings',
        icon: 'type',
      },
      {
        title: 'Usuários',
        org: false,
        url: '/users',
        icon: 'users',
      },
    ]
  },
];

// Função para gerar os navItems com o slug da organização
export function getNavItems(orgSlug: string | null): NavItem[] {
  const baseUrl = `/org/${orgSlug}`;
  
  return baseNavItems.map(item => ({
    ...item,
    url: item.org ? `${baseUrl}${item.url}` : item.url,
    items: item.items?.map((subItem: any) => ({
      ...subItem,
      url: `${baseUrl}${subItem.url}`
    })) || []
  })) as NavItem[];
}