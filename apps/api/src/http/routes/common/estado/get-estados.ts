// routes/estado.routes.ts
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { auth } from '@/http/middlewares/auth';
import {
  EstadoCreateSchema,
  EstadoUpdateSchema,
  EstadoResponseSchema,
  PaginatedEstadosSchema,
  GetEstadosQuerySchema,
  MunicipioSchema,
  EstadoService,
  GetEstadosQuery,
} from '@/services/estado-service';

// Schema para params
const estadoParamsSchema = z.object({
  estado_id: z.coerce.number().int().positive('ID do estado inválido'),
});

const ufParamsSchema = z.object({
  uf: z.string().length(2).toUpperCase(),
});

// Schema de response
const createResponseSchema = z.object({
  id: z.number().int(),
  message: z.string(),
});

const updateResponseSchema = z.object({
  id: z.number().int(),
  message: z.string(),
});

const deleteResponseSchema = z.object({
  message: z.string(),
});

const municipiosResponseSchema = z.array(MunicipioSchema);

// Schema de erro
const errorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  message: z.string().optional(),
});

export async function estadoRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().register(auth);
  app.get<{
    Querystring: z.infer<typeof GetEstadosQuerySchema>;
  }>(
    '/estados',
    {
      schema: {
        description: 'Lista estados com paginação, filtros e ordenação',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        querystring: GetEstadosQuerySchema,
        response: {
          200: PaginatedEstadosSchema,
          400: errorSchema,
          401: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as GetEstadosQuery;

        const result = await EstadoService.getEstadosPaginated(query);

        return reply.code(200).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'Validação falhou',
            details: error.flatten().fieldErrors,
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

  app.get<{
    Params: z.infer<typeof estadoParamsSchema>;
  }>(
    '/estados/:estado_id',
    {
      schema: {
        description: 'Obter detalhes de um estado por ID',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        params: estadoParamsSchema,
        querystring: z.object({
          include_municipios: z
            .enum(['true', 'false'])
            .transform((v) => v === 'true')
            .default(false)
            .optional(),
        }),
        response: {
          200: EstadoResponseSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { estado_id } = request.params;
        const includeMunicipios =
          (request.query as any).include_municipios === 'true';

        const estado = await EstadoService.getEstadoById(
          estado_id,
          includeMunicipios
        );

        if (!estado) {
          return reply.code(404).send({ error: 'Estado não encontrado' });
        }

        return reply.code(200).send(estado);
      } catch (error) {
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

  // GET /estados/uf/:uf - Obter um estado por UF
  app.get<{
    Params: z.infer<typeof ufParamsSchema>;
  }>(
    '/estados/uf/:uf',
    {
      schema: {
        description: 'Obter detalhes de um estado por UF (sigla)',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        params: ufParamsSchema,
        querystring: z.object({
          include_municipios: z
            .enum(['true', 'false'])
            .transform((v) => v === 'true')
            .default(false)
            .optional(),
        }),
        response: {
          200: EstadoResponseSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { uf } = request.params;
        const includeMunicipios =
          (request.query as any).include_municipios === 'true';

        const estado = await EstadoService.getEstadoByUf(
          uf,
          includeMunicipios
        );

        if (!estado) {
          return reply.code(404).send({ error: 'Estado não encontrado' });
        }

        return reply.code(200).send(estado);
      } catch (error) {
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

  // POST /estados - Criar um novo estado
  app.post<{
    Body: z.infer<typeof EstadoCreateSchema>;
  }>(
    '/estados',
    {
      schema: {
        description: 'Cria um novo estado',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        body: EstadoCreateSchema,
        response: {
          201: createResponseSchema,
          400: errorSchema,
          401: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const data = request.body;

        const estadoId = await EstadoService.createEstado(data);

        return reply.code(201).send({
          id: estadoId,
          message: 'Estado criado com sucesso',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'Dados inválidos',
            details: error.flatten().fieldErrors,
          });
        }

        if (error instanceof Error) {
          if (error.message.includes('já existe')) {
            return reply.code(400).send({
              error: error.message,
            });
          }

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

  // PUT /estados/:estado_id - Atualizar um estado
  app.put<{
    Params: z.infer<typeof estadoParamsSchema>;
    Body: z.infer<typeof EstadoUpdateSchema>;
  }>(
    '/estados/:estado_id',
    {
      schema: {
        description: 'Atualiza um estado existente',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        params: estadoParamsSchema,
        body: EstadoUpdateSchema,
        response: {
          200: updateResponseSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { estado_id } = request.params;
        const data = request.body;

        const updatedId = await EstadoService.updateEstado(estado_id, data);

        if (!updatedId) {
          return reply.code(404).send({ error: 'Estado não encontrado' });
        }

        return reply.code(200).send({
          id: updatedId,
          message: 'Estado atualizado com sucesso',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            error: 'Dados inválidos',
            details: error.flatten().fieldErrors,
          });
        }

        if (error instanceof Error) {
          if (error.message.includes('já existe')) {
            return reply.code(400).send({
              error: error.message,
            });
          }

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

  // DELETE /estados/:estado_id - Deletar um estado
  app.delete<{
    Params: z.infer<typeof estadoParamsSchema>;
  }>(
    '/estados/:estado_id',
    {
      schema: {
        description: 'Deleta um estado',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        params: estadoParamsSchema,
        response: {
          200: deleteResponseSchema,
          401: errorSchema,
          404: errorSchema,
          400: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { estado_id } = request.params;

        const success = await EstadoService.deleteEstado(estado_id);

        if (!success) {
          return reply.code(404).send({ error: 'Estado não encontrado' });
        }

        return reply.code(200).send({
          message: 'Estado deletado com sucesso',
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('municípios')) {
            return reply.code(400).send({
              error: error.message,
            });
          }

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

  // GET /estados/search - Buscar estados por termo
  app.get<{
    Querystring: {
      q: string;
      limit?: string;
    };
  }>(
    '/estados/search',
    {
      schema: {
        description: 'Buscar estados por termo de pesquisa',
        tags: ['Estados'],
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          q: z.string().min(1, 'Termo de busca obrigatório'),
          limit: z.coerce
            .number()
            .int()
            .positive()
            .max(100)
            .default(10)
            .optional(),
        }),
        response: {
          200: z.array(EstadoResponseSchema),
          400: errorSchema,
          401: errorSchema,
          500: errorSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { q, limit = '10' } = request.query;

        const result = await EstadoService.getEstadosPaginated({
          page: 1,
          limit: Math.min(Number(limit), 100),
          search: q,
          order_by: 'nome',
          order: 'asc',
          include_municipios: false,
        });

        return reply.code(200).send(result.data);
      } catch (error) {
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