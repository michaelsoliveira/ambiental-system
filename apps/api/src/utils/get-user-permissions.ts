import { defineAbilitiesFor, userSchema, type Role } from '@saas/auth'

export function getUserPermissions(userId: string, roles: Role[]) {
  const authUser = userSchema.parse({
    id: userId,
    roles
  })

  const ability = defineAbilitiesFor(authUser)

  return ability
}