import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { auth } from '@/http/middlewares/auth';
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error';
import { getUserPermissions } from '@/utils/get-user-permissions';
import { getPessoasQuerySchema } from '@/services/pessoa-service';

export async function getPessoas(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/pessoas',
      {
        schema: {
          description: 'Lista pessoas com paginação e filtros',
          tags: ['Pessoas'],
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string().min(1, 'Slug é obrigatório') }),
          querystring: getPessoasQuerySchema,
        },
      },
      async (request, reply) => {
        try {
          const { slug } = request.params;
          const userId = await request.getCurrentUserId();
          
          const { organization, membership } = await request.getUserMembership(slug);
          const { cannot } = getUserPermissions(
            userId,
            membership.members_roles.map((mr: any) => mr.roles.name)
          );

          if (cannot('get', 'Pessoa')) {
            throw new UnauthorizedError(
              'Você não tem permissão para visualizar pessoas.'
            );
          }

          // Remove empty strings from raw query
          const rawQuery = request.query as Record<string, any>;
          const cleanQuery = Object.fromEntries(
            Object.entries(rawQuery).filter(([_, v]) => v !== '')
          );
          
          // Parse through schema to get proper typing and validation
          const query = getPessoasQuerySchema.parse(cleanQuery);
          // Add organization_id to the query
          const result = await app.pessoaService.getPessoasPaginated({
            ...query,
            organization_id: organization.id,
          });

          return reply.code(200).send(result);
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            return reply.code(401).send({
              error: error.message,
            });
          }

          if (error instanceof z.ZodError) {
            return reply.code(400).send({
              error: 'Validação falhou',
              details: error.stack,
            });
          }

          if (error instanceof Error) {
            app.log.error(error);
            return reply.code(500).send({
              error: 'Erro interno do servidor',
              message: error.message,
            });
          }

          app.log.error(error);
          return reply.code(500).send({
            error: 'Erro desconhecido',
          });
        }
      }
    );
}