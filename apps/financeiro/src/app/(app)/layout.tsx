import { redirect } from 'next/navigation'

import { auth } from '@/auth/auth'

export default async function AppLayout({
  children,
  sheet,
}: Readonly<{
  children: React.ReactNode
  sheet: React.ReactNode
}>) {
  await auth()

  return (
    <>
      {children}
      {sheet}
    </>
  )
}