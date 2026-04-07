import './globals.css'

import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Toaster } from '@/components/ui/sonner';

import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Ambiental System',
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