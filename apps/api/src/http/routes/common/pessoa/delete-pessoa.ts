import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { parceiroSchema } from '@saas/auth'

export async function deletePessoa(app: FastifyInstance) {
  app
  .withTypeProvider<ZodTypeProvider>()
  .register(auth)
  .delete<{
    Params: { slug: string, id: string };
  }>(
    '/organizations/:slug/pessoas/:id',
    {
      schema: {
        description: 'Deleta uma pessoa',
        tags: ['Pessoas'],
        security: [{ bearerAuth: [] }],
        params: z.object({ slug: z.string(), id: z.string().min(1, 'ID Pessoa é obrigatório') }),
        // params: {
        //   type: 'object',
        //   required: ['id'],
        //   properties: {
        //     id: { type: 'string', format: 'uuid' }
        //   },
        // },
        response: {
          200: z.object({
            message: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
          403: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        
        const { slug, id } = request.params
        const userId = await request.getCurrentUserId()
        const { organization, membership } = await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(
          userId,
          membership.members_roles.map((mr: any) => mr.roles.name),
        )

        if (cannot('delete', 'Pessoa')) {
          throw new UnauthorizedError('Você não tem permissão para deletar esta pessoa.')
        }

        const success = await app.pessoaService.deletePessoa(
          id
        );

        if (!success) {
          return reply.code(404).send({ error: 'Ocorreu um erro tentando excluir a pessoa' });
        }

        return reply.code(200).send({ message: 'Pessoa deletada com sucesso' });
      } catch (error: any) {
        app.log.error(error);
        return reply.code(500).send({ error: `Erro interno do servidor: ${error.message}` });
      }
    }
  );
}