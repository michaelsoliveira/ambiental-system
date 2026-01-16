import { NavItem } from 'types';

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

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
   {
    title: 'Cadastro',
    url: '#',
    icon: 'settings',
    isActive: true,
    items: [
      {
        title: 'Pessoas',
        url: '/dashboard/pessoa',
        icon: 'ellipsis'
      },
      {
        title: 'Licenças',
        url: '/dashboard/licenca',
        icon: 'userPen',
      },
      {
        title: 'Condicionantes',
        url: '/dashboard/condicionante',
        icon: 'userPen',
      },
    ]
  },
  {
    title: 'Usuários',
    url: '/dashboard/user',
    icon: 'user',
  },
  {
    title: 'Tipos de Licença',
    url: '/dashboard/tipo-licenca',
    icon: 'kanban',
  },
];