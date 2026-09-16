import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import {
  localFallbackEnabled,
  oidcEnabled,
  resolveOidcLocalUserId,
  verifyOidcToken,
} from '@/lib/oidc'
import { prisma } from '@/lib/prisma'

function bearerToken(request: { headers: { authorization?: string } }): string | null {
  const header = request.headers.authorization
  if (!header?.toLowerCase().startsWith('bearer ')) return null
  return header.slice(7).trim() || null
}

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUserId = async () => {
      const token = bearerToken(request)

      if (token && oidcEnabled()) {
        try {
          const payload = await verifyOidcToken(token)
          return await resolveOidcLocalUserId(payload)
        } catch {
          if (!localFallbackEnabled()) {
            throw new UnauthorizedError('Invalid token')
          }
        }
      }

      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Invalid token')
      }
    }

    request.getUserMembership = async (slug: string) => {
      const userId = await request.getCurrentUserId()
      const member = await prisma.member.findFirst({
        where: {
          user_id: userId,
          organization: {
            slug,
          },
        },
        include: {
          organization: true,
          members_roles: {
            include: {
              roles: true
            }
          },
          members_permissions: {
            include: {
              permissions: true
            }
          }
        },
      })

      if (!member) {
        throw new UnauthorizedError(`You're not a member of this organization.`)
      }

      const { organization, ...membership } = member

      return {
        organization,
        membership,
      }
    }
  })
})