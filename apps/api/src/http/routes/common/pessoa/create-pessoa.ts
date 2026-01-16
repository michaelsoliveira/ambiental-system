import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { auth } from '@/http/middlewares/auth';
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error';
import { BadRequestError } from '@/http/routes/_errors/bad-request-error';
import { getUserPermissions } from '@/utils/get-user-permissions';
import { PessoaCreate, pessoaCreateSchema } from '@/services/pessoa-service';
import { prisma } from '@/lib/prisma';

// Schema para params da rota
const paramsSchema = z.object({
  slug: z.string().min(1, 'Slug da organização é obrigatório'),
});

// Schema para response
const responseSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
  success: z.boolean().default(false)
});

// routes/create-pessoa.ts
export async function createPessoa(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/pessoas',
      {
        schema: {
          description: 'Cria uma nova pessoa na organização',
          tags: ['Pessoas'],
          security: [{ bearerAuth: [] }],
          params: paramsSchema,
          body: pessoaCreateSchema,
          response: {
            201: responseSchema,
            400: z.object({
              error: z.string(),
            }),
            401: z.object({
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
          const { slug } = paramsSchema.parse(request.params);
          const data = request.body;
          const userId = await request.getCurrentUserId();

          const { organization, membership } =
            await request.getUserMembership(slug);

          const { cannot } = getUserPermissions(
            userId,
            membership.members_roles.map((mr: any) => mr.roles.name)
          );

          if (cannot('create', 'Pessoa')) {
            throw new UnauthorizedError(
              'Você não tem permissão para criar pessoas.'
            );
          }

          // Validar tipo e dados
          if (data.tipo === 'F' && !data.fisica) {
            throw new BadRequestError(
              'Dados de pessoa física são obrigatórios quando tipo é F'
            );
          }

          if (data.tipo === 'J' && !data.juridica) {
            throw new BadRequestError(
              'Dados de pessoa jurídica são obrigatórios quando tipo é J'
            );
          }

          // ✅ Verificar se já existe
          const existente = data.tipo === 'J' 
            ? await prisma.pessoaJuridica.findUnique({
                where: { 
                  organization_id_cnpj: {
                    organization_id: organization.id,
                    cnpj: data.juridica.cnpj.replace(/\D/g, '') // Remove formatação
                  }
                },
                include: { pessoa: true }
              })
            : await prisma.pessoaFisica.findUnique({
                where: { 
                  organization_id_cpf: {
                    organization_id: organization.id,
                    cpf: data.fisica.cpf.replace(/\D/g, '') // Remove formatação
                  }
                },
                include: { pessoa: true }
              });

          if (existente) {
            const documento = data.tipo === 'J' 
              ? `CNPJ ${data.juridica.cnpj}` 
              : `CPF ${data.fisica.cpf}`;
            
            // ✅ Retornar 409 (Conflict) ao invés de 400
            return reply.code(409).send({
              error: `Já existe uma pessoa cadastrada com este ${documento} nesta organização.`,
            });
          }

          const pessoaId = await app.pessoaService.createPessoa(
            {
              ...data,
              organization_id: organization.id
            },
            userId
          );

          return reply.code(201).send({
            id: pessoaId,
            message: 'Pessoa criada com sucesso',
            success: true
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