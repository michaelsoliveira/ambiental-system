import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { LancamentoService } from '@/services/lancamento.service'
import { parseMultipartForm } from '@/utils/helpers'
import { lancamentoCreateSchema } from './create-lancamento'

export const lancamentoUpdateSchema = lancamentoCreateSchema.partial()

export async function updateLancamento(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug/financeiro/lancamentos/:lancamentoId',
      {
        schema: {
          tags: ['Financeiro - Lançamentos'],
          summary: 'Atualizar lançamento',
          security: [{ bearerAuth: [] }],
          params: z.object({ 
            slug: z.string(),
            lancamentoId: z.string().uuid()
          }),
          consumes: ['multipart/form-data'],
          response: {
            200: z.object({ message: z.string() }),
            400: z.object({ error: z.string() }),
            403: z.object({ error: z.string() }),
            404: z.object({ error: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          if (!request.isMultipart()) {
            throw new BadRequestError('O corpo da requisição não é multipart/form-data')
          }

          const { slug, lancamentoId } = request.params
          const userId = await request.getCurrentUserId()
          const { organization, membership } = await request.getUserMembership(slug)

          const { cannot } = getUserPermissions(
            userId,
            membership.members_roles.map((mr: any) => mr.roles.name),
          )

          if (cannot('update', 'Lancamento')) {
            throw new UnauthorizedError('Você não tem permissão para atualizar lançamentos.')
          }

          const { data: formData } = await parseMultipartForm(request)
          const parsedData = JSON.parse(formData['data'])
          const result = lancamentoUpdateSchema.safeParse(parsedData)

          if (!result.success) {
            const errors = result.error.flatten()
            throw new BadRequestError(
              `Erro de validação: ${JSON.stringify(errors.formErrors)}`
            )
          }

          await LancamentoService.update(lancamentoId, organization.id, result.data)

          return reply.status(200).send({ message: 'Lançamento atualizado com sucesso.' })
        } catch (error) {
          app.log.error(error)
          
          if (error instanceof UnauthorizedError) {
            return reply.code(403).send({ error: error.message })
          }
          if (error instanceof BadRequestError) {
            return reply.code(400).send({ error: error.message })
          }
          
          return reply.code(400).send({ 
            error: error instanceof Error ? error.message : 'Erro ao atualizar lançamento' 
          })
        }
      },
    )
}