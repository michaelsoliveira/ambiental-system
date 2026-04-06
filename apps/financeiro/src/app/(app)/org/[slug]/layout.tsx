import { cookies } from 'next/headers';

import AppSidebar from '@/components/layout/app-sidebar';
// import { Header } from '@/components/header';
import Header from '@/components/layout/header';
import { Tabs } from '@/components/tabs'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default async function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className='flex w-full'>
        <div className='print:hidden'>
          <AppSidebar />
        </div>
        <SidebarInset className="flex flex-col h-full">
          <Header />
          <div className="flex-1 overflow-hidden">            
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}