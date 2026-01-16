// routes/update-pessoa.ts
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { auth } from '@/http/middlewares/auth';
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error';
import { BadRequestError } from '@/http/routes/_errors/bad-request-error';
import { getUserPermissions } from '@/utils/get-user-permissions';
import { PessoaUpdate, pessoaUpdateSchema } from '@/services/pessoa-service';
import { prisma } from '@/lib/prisma';

// Schema para params da rota
const paramsSchema = z.object({
  slug: z.string().min(1, 'Slug da organização é obrigatório'),
  id: z.string().uuid('ID inválido'),
});

// Schema para response
const responseSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  success: z.boolean().default(true),
});

export async function updatePessoa(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put<{
      Params: z.infer<typeof paramsSchema>;
      Body: PessoaUpdate;
    }>(
      '/organizations/:slug/pessoas/:id',
      {
        schema: {
          description: 'Atualiza uma pessoa existente na organização',
          tags: ['Pessoas'],
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          body: pessoaUpdateSchema,
          response: {
            200: responseSchema,
            400: z.object({
              error: z.string(),
            }),
            401: z.object({
              error: z.string(),
            }),
            404: z.object({
              error: z.string(),
            }),
            409: z.object({
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
          const { slug, id } = paramsSchema.parse(request.params);
          const data = request.body;
          const userId = await request.getCurrentUserId();

          const { organization, membership } =
            await request.getUserMembership(slug);

          const { cannot } = getUserPermissions(
            userId,
            membership.members_roles.map((mr: any) => mr.roles.name)
          );

          if (cannot('update', 'Pessoa')) {
            throw new UnauthorizedError(
              'Você não tem permissão para atualizar pessoas.'
            );
          }

          // Verificar se a pessoa existe e pertence à organização
          const pessoaExistente = await prisma.pessoa.findFirst({
            where: {
              id,
              organization_id: organization.id,
            },
            include: {
              fisica: true,
              juridica: true,
            },
          });

          if (!pessoaExistente) {
            return reply.code(404).send({
              error: 'Pessoa não encontrada nesta organização.',
            });
          }

          // Se estiver atualizando CPF/CNPJ, verificar duplicidade
          if (data.fisica?.cpf) {
            const cpfLimpo = data.fisica.cpf.replace(/\D/g, '');
            const cpfDuplicado = await prisma.pessoaFisica.findFirst({
              where: {
                organization_id: organization.id,
                cpf: cpfLimpo,
                pessoa_id: { not: id }, // Excluir a própria pessoa
              },
            });

            if (cpfDuplicado) {
              return reply.code(409).send({
                error: `Já existe outra pessoa cadastrada com o CPF ${data.fisica.cpf} nesta organização.`,
              });
            }

            // Atualizar com CPF limpo
            data.fisica.cpf = cpfLimpo;
          }

          if (data.juridica?.cnpj) {
            const cnpjLimpo = data.juridica.cnpj.replace(/\D/g, '');
            const cnpjDuplicado = await prisma.pessoaJuridica.findFirst({
              where: {
                organization_id: organization.id,
                cnpj: cnpjLimpo,
                pessoa_id: { not: id }, // Excluir a própria pessoa
              },
            });

            if (cnpjDuplicado) {
              return reply.code(409).send({
                error: `Já existe outra pessoa cadastrada com o CNPJ ${data.juridica.cnpj} nesta organização.`,
              });
            }

            // Atualizar com CNPJ limpo
            data.juridica.cnpj = cnpjLimpo;
          }

          const updatedId = await app.pessoaService.updatePessoa(
            id,
            data,
            organization.id
          );

          if (!updatedId) {
            return reply.code(404).send({
              error: 'Erro ao atualizar pessoa.',
            });
          }

          return reply.code(200).send({
            id: updatedId,
            message: 'Pessoa atualizada com sucesso',
            success: true,
          });
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            return reply.code(400).send({
              error: 'Dados inválidos',
            });
          }

          if (error instanceof UnauthorizedError) {
            return reply.code(401).send({
              error: error.message,
            });
          }

          if (error instanceof BadRequestError) {
            return reply.code(400).send({
              error: error.message,
            });
          }

          app.log.error(error);
          return reply.code(500).send({
            error: 'Erro interno do servidor',
          });
        }
      }
    );
}