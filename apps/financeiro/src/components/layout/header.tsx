import React from 'react';

import { Breadcrumbs } from '../breadcrumbs';
import { PendingInvites } from '../pending-invites';
import { ProfileButton } from '../profile-button';
import SearchInput from '../search-input';
import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';
import ThemeToggle from './ThemeToggle/theme-toggle';

export default function Header() {
  return (
    <header className='sticky top-0 flex h-16 z-50 w-full bg-sidebar items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 print:hidden border-b border-gray-200 shadow-sm'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <Breadcrumbs />
      </div>

      <div className='flex items-center gap-2 px-4'>
        {/* <div className='hidden md:flex'>
          <SearchInput />
        </div> */}
        {/* <UserNav /> */}
        <PendingInvites />
        <Separator orientation="vertical" className="h-5" />
        <ProfileButton />
        <ThemeToggle />
      </div>
    </header>
  );
}