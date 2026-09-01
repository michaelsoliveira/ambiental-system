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
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh max-h-svh overflow-hidden">
      <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
        <div className="print:hidden">
          <AppSidebar />
        </div>
        <SidebarInset className="flex h-full min-h-0 min-w-0 w-auto max-w-full flex-1 flex-col overflow-hidden">
          <Header />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}