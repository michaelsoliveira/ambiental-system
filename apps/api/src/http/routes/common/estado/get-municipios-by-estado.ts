// routes/estado.routes.ts
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { auth } from '@/http/middlewares/auth';
import {
  GetMunicipiosQuerySchema,
  MunicipioSchema,
  EstadoService,
} from '@/services/estado-service';

// Schema para params
const estadoParamsSchema = z.object({
  estado_id: z.coerce.number().int().positive('ID do estado inválido'),
});

const municipiosResponseSchema = z.array(MunicipioSchema);

// Schema de erro
const errorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  message: z.string().optional(),
});

export async function getMunicipiosByEstado(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get<{
        Params: z.infer<typeof estadoParamsSchema>;
        Querystring: Omit<z.infer<typeof GetMunicipiosQuerySchema>, 'estado_id'>;
    }>(
        '/estados/:estado_id/municipios',
        {
        schema: {
            description: 'Listar todos os municípios de um estado com filtros e ordenação',
            tags: ['Estados', 'Municípios'],
            security: [{ bearerAuth: [] }],
            params: estadoParamsSchema,
            querystring: z.object({
            search: z.string().optional(),
            order_by: z.enum(['nome', 'ibge']).default('nome').optional(),
            order: z.enum(['asc', 'desc']).default('asc').optional(),
            }),
            response: {
            200: municipiosResponseSchema,
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
            const query = request.query as any;

            const municipios = await EstadoService.getMunicipiosByEstadoId({
            estado_id,
            search: query.search,
            order_by: query.order_by || 'nome',
            order: query.order || 'asc',
            });

            return reply.code(200).send(municipios);
        } catch (error) {
            if (error instanceof Error) {
            // Verifica se é erro de estado não encontrado
            if (error.message.includes('Estado não encontrado')) {
                return reply.code(404).send({
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
    )
}