import { defineAbilitiesFor } from '@saas/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getMembership } from '@/http/get-membership'
import { getProfile } from '@/http/get-profile'

export async function isAuthenticated() {
    const cookie = await cookies()
    return !!cookie.get('token')?.value
}

export async function getCurrentOrg() {
    const cookie = await cookies()
    return cookie.get('org')?.value ?? null
}

export async function getCurrentMembership() {
  const org = await getCurrentOrg()

  if (!org) {
    return null
  }

  const { membership } = await getMembership(org)

  return membership
}

export async function ability() {
  const membership = await getCurrentMembership()

  if (!membership) {
    return null
  }

  const ability = defineAbilitiesFor({
    __typename: "User",
    id: membership.user_id,
    roles: membership.roles,
  })

  return ability
}

export async function auth() {
    const cookie = await cookies()
    const token = cookie.get('token')?.value

    if (!token) {
        redirect('/auth/sign-in')
    }

    try {
        const { user } = await getProfile()

        return { user }
    } catch {}

    redirect('/api/auth/sign-out')
}