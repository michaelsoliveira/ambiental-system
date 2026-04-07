import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin } from '@/lib/app-origin'

export async function GET(request: NextRequest) {
  const signIn = new URL('/auth/sign-in', getAppOrigin(request))
  const cookie = await cookies()
  cookie.delete('token')

  return NextResponse.redirect(signIn)
}