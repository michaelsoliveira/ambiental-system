import './globals.css'

import type { Metadata } from 'next'

import { Providers } from './providers'
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'AmapaCode Soluções',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NuqsAdapter>
          <Toaster />
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}