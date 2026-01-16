'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
  useSidebar,
} from '@/components/ui/sidebar';
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
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  GalleryVerticalEnd,
  LogOut,
} from 'lucide-react';
import { getNavItems } from '@/constants/data';
import { Icons } from '../icons';
import { SidebarItemWithPopup } from './sidebar-item-with-popup';
import { SidebarItemWithCollapsible } from './sidebar-item-with-collapsible';

export const company = {
  name: 'Ambiental System',
  logo: GalleryVerticalEnd,
  plan: 'Sistema Financeiro',
};

interface AppSidebarProps {
  slug: string | null;
  user: any
}

export default function SidebarClient({ user, slug }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const navItems = getNavItems(slug);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex gap-2 py-2 text-sidebar-accent-foreground'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <company.logo className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>{company.name}</span>
            <span className='truncate text-xs'>{company.plan}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Visão Geral</SidebarGroupLabel>
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
                    className={`
                      relative transition-all duration-200 rounded-md
                      ${
                        pathname === item.url && mounted
                          ? "bg-[var(--sidebar-accent)]/30 text-[var(--sidebar-primary)] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[var(--sidebar-primary)] before:rounded-r-sm shadow-sm"
                          : "hover:bg-[var(--sidebar-accent)]/20 text-[var(--muted-foreground)]"
                      }
                    `}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size='lg'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage src={user?.avatarUrl || ''} />
                    <AvatarFallback className='rounded-lg'>
                      {user?.username?.slice(0, 2)?.toUpperCase() || 'CN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {user?.username}
                    </span>
                    <span className='truncate text-xs'>{user?.email}</span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side='bottom' align='end' sideOffset={4}>
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5'>
                    <Avatar className='h-8 w-8 rounded-lg'>
                      <AvatarImage src={user?.avatarUrl || ''} />
                      <AvatarFallback className='rounded-lg'>
                        {user?.username?.slice(0, 2)?.toUpperCase() || 'CN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-semibold'>
                        {user?.username}
                      </span>
                      <span className='truncate text-xs'>{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem><BadgeCheck /> Account</DropdownMenuItem>
                  <DropdownMenuItem><CreditCard /> Billing</DropdownMenuItem>
                  <DropdownMenuItem><Bell /> Notifications</DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <a href="/api/auth/sign-out">
                    <LogOut className="mr-2 size-4" /> Sign Out
                  </a>
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
