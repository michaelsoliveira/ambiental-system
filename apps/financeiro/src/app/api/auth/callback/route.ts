import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin } from '@/lib/app-origin'
import { acceptInvite } from '@/http/accept-invite'
import { signInWithGithub } from '@/http/sign-in-with-github'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { message: 'Github OAuth  code was not found.' },
      { status: 400 },
    )
  }

  const { token } = await signInWithGithub({ code })
  const cookie = await cookies()
  cookie.set('token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7days
  })

  const inviteId = cookie.get('inviteId')?.value

  if (inviteId) {
    try {
      await acceptInvite(inviteId)
      cookie.delete('inviteId')
    } catch {}
  }

  const home = new URL('/', getAppOrigin(request))

  return NextResponse.redirect(home)
}