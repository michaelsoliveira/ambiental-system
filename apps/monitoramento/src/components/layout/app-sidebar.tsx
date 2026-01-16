'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import {
  Bell,
  ChevronsUpDown,
  LeafIcon,
  LogOut
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { SidebarItemWithPopup } from '../ui/sidebar-item-with-popup';
import { SidebarItemWithCollapsible } from '../ui/sidebar-item-with-collapsible';
import Image from 'next/image';
import { setPessoaCookie } from '@/app/actions/set-pessoa-cookie';

export const company = {
  name: 'AmbientalSystem',
  // logo: LeafIcon,
  plan: 'Consultoria & Serviços'
};

export default function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  return (
    <Sidebar 
      collapsible='icon'
    >
      <div className="absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/fundo-login.jpg')" }}
        >
          <div className="h-full w-full bg-gradient-to-b from-black/75 via-black/60 to-black/70 opacity-90" />
        </div>
      </div>
      <SidebarHeader>
        <div className='text-sidebar-accent-foreground flex gap-2 py-2'>
          <div className='aspect-square size-8 items-center justify-center'>
            {/* <company.logo className='size-4' /> */}
            <Image src='/images/only-logo-2.svg' width={100} height={100} alt='Logo Ambiental' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-semibold text-[#44ABB6]'>{company.name.slice(0, 9)}</span><span className='truncate font-semibold text-[#FFD059]'>{company.name.slice(9)}</span>
            {/* <span className='truncate text-xs'>{company.plan}</span> */}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden text-white'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <React.Fragment key={item.title}>
                  { !isMobile ? 
                    (state === 'collapsed' ? (
                      <SidebarItemWithPopup item={item} pathname={pathname} />
                    ) : (
                      <SidebarItemWithCollapsible item={item} pathname={pathname} />
                    )) : (
                      <>
                        <SidebarItemWithCollapsible item={item} pathname={pathname} />
                      </>
                    )}
                  </React.Fragment>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
              }
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='text-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='h-8 w-8 rounded-lg text-sidebar-accent-foreground hover:text-sidebar-accent'>
                    <AvatarImage
                      src={session?.user?.image || ''}
                      alt={session?.user?.username || ''}
                    />
                    <AvatarFallback className='rounded-lg'>
                      {session?.user?.username?.slice(0, 2)?.toUpperCase() || 'CN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {session?.user?.username || ''}
                    </span>
                    <span className='truncate text-xs'>
                      {session?.user?.email || ''}
                    </span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <Avatar className='h-8 w-8 rounded-lg bg-sidebar-accent'>
                      <AvatarImage
                        src={session?.user?.image || ''}
                        alt={session?.user?.username || ''}
                      />
                      <AvatarFallback className='rounded-lg'>
                        {session?.user?.username?.slice(0, 2)?.toUpperCase() ||
                          'CN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-semibold'>
                        {session?.user?.username || ''}
                      </span>
                      <span className='truncate text-xs'>
                        {' '}
                        {session?.user?.email || ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Bell />&nbsp;Notificações
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  signOut()
                  setPessoaCookie(null)
                }}>
                  <LogOut />&nbsp;Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
