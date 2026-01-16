import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { pessoaResponseSchema } from '@/services/pessoa-service'
import { processPessoa } from '@/utils/helpers'

export async function getPessoa(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/pessoas/:pessoaId',
      {
        schema: {
          tags: ['Financeiro - Parceiros'],
          summary: 'Obter detalhes de um parceiro',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), pessoaId: z.string().uuid() }),
          response: {
            200: pessoaResponseSchema,
          },
        },
      },
      async (request, reply) => {
        const { slug, pessoaId } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('get', 'Pessoa')) {
          throw new UnauthorizedError('Você não tem permissão para visualizar esta pessoa.')
        }

        const pessoa = await prisma.pessoa.findUnique({
          include: {
            fisica: true,
            juridica: true,
            endereco: true,
            created_by_user: true,
            user: true
          },
          where: {
            id: pessoaId            
          },
        });
        
        if (!pessoa) {
          throw new BadRequestError('Pessoa não encontrado.')
        }

        const pessoaSerialized = processPessoa(pessoa);

        return reply.send(pessoaSerialized)
      },
    )
}