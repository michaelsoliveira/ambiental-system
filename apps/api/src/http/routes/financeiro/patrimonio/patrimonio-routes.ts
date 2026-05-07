import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import {
  patrimonioAtivoCreateSchema,
  patrimonioAtivoUpdateSchema,
  patrimonioAvaliacaoCreateSchema,
  patrimonioPassivoCreateSchema,
  patrimonioPassivoUpdateSchema,
} from '@/services/patrimonio.service'
import { getUserPermissions } from '@/utils/get-user-permissions'

const listQuerySchema = z.object({
  search: z.string().optional(),
  categoria: z.string().optional(),
  tipo: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

async function getOrganizationContext(request: any, slug: string, action: 'get' | 'create' | 'update' | 'delete') {
  const userId = await request.getCurrentUserId()
  const { organization, membership } = await request.getUserMembership(slug)
  const { cannot } = getUserPermissions(
    userId,
    membership.members_roles.map((mr: any) => mr.roles.name),
  )

  if (cannot(action, 'Patrimonio')) {
    throw new UnauthorizedError('Você não tem permissão para acessar patrimônios.')
  }

  return organization
}

export async function patrimonioRoutes(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:slug/financeiro/patrimonios/resumo',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Resumo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          response: { 200: z.any() },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const organization = await getOrganizationContext(request, slug, 'get')
        const resumo = await app.patrimonioService.getResumo(organization.id)

        return reply.send(resumo)
      },
    )
    .get(
      '/organizations/:slug/financeiro/patrimonios/ativos',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Listar ativos patrimoniais',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: listQuerySchema,
          response: { 200: z.any() },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const organization = await getOrganizationContext(request, slug, 'get')
        const result = await app.patrimonioService.listAtivos(organization.id, request.query)

        return reply.send(result)
      },
    )
    .post(
      '/organizations/:slug/financeiro/patrimonios/ativos',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Criar ativo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: patrimonioAtivoCreateSchema,
          response: { 201: z.object({ patrimonioAtivoId: z.string().uuid() }) },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const organization = await getOrganizationContext(request, slug, 'create')
        const patrimonioAtivoId = await app.patrimonioService.createAtivo(request.body, organization.id)

        return reply.status(201).send({ patrimonioAtivoId })
      },
    )
    .get(
      '/organizations/:slug/financeiro/patrimonios/ativos/:ativoId',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Buscar ativo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), ativoId: z.string().uuid() }),
          response: { 200: z.any() },
        },
      },
      async (request, reply) => {
        const { slug, ativoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'get')
        const ativo = await app.patrimonioService.getAtivo(ativoId, organization.id)

        if (!ativo) {
          throw new BadRequestError('Ativo patrimonial não encontrado.')
        }

        return reply.send(ativo)
      },
    )
    .put(
      '/organizations/:slug/financeiro/patrimonios/ativos/:ativoId',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Atualizar ativo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), ativoId: z.string().uuid() }),
          body: patrimonioAtivoUpdateSchema,
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, ativoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'update')
        const updated = await app.patrimonioService.updateAtivo(ativoId, request.body, organization.id)

        if (!updated) {
          throw new BadRequestError('Ativo patrimonial não encontrado.')
        }

        return reply.status(204).send()
      },
    )
    .delete(
      '/organizations/:slug/financeiro/patrimonios/ativos/:ativoId',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Excluir ativo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), ativoId: z.string().uuid() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, ativoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'delete')
        const deleted = await app.patrimonioService.deleteAtivo(ativoId, organization.id)

        if (!deleted) {
          throw new BadRequestError('Ativo patrimonial não encontrado.')
        }

        return reply.status(204).send()
      },
    )
    .post(
      '/organizations/:slug/financeiro/patrimonios/ativos/:ativoId/avaliacoes',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Registrar avaliação do ativo',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), ativoId: z.string().uuid() }),
          body: patrimonioAvaliacaoCreateSchema,
          response: { 201: z.object({ patrimonioAvaliacaoId: z.string().uuid() }) },
        },
      },
      async (request, reply) => {
        const { slug, ativoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'update')
        const patrimonioAvaliacaoId = await app.patrimonioService.createAvaliacao(
          ativoId,
          request.body,
          organization.id,
        )

        if (!patrimonioAvaliacaoId) {
          throw new BadRequestError('Ativo patrimonial não encontrado.')
        }

        return reply.status(201).send({ patrimonioAvaliacaoId })
      },
    )
    .get(
      '/organizations/:slug/financeiro/patrimonios/passivos',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Listar passivos patrimoniais',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          querystring: listQuerySchema,
          response: { 200: z.any() },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const organization = await getOrganizationContext(request, slug, 'get')
        const result = await app.patrimonioService.listPassivos(organization.id, request.query)

        return reply.send(result)
      },
    )
    .post(
      '/organizations/:slug/financeiro/patrimonios/passivos',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Criar passivo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),
          body: patrimonioPassivoCreateSchema,
          response: { 201: z.object({ patrimonioPassivoId: z.string().uuid() }) },
        },
      },
      async (request, reply) => {
        const { slug } = request.params
        const organization = await getOrganizationContext(request, slug, 'create')
        const patrimonioPassivoId = await app.patrimonioService.createPassivo(request.body, organization.id)

        return reply.status(201).send({ patrimonioPassivoId })
      },
    )
    .get(
      '/organizations/:slug/financeiro/patrimonios/passivos/:passivoId',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Buscar passivo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), passivoId: z.string().uuid() }),
          response: { 200: z.any() },
        },
      },
      async (request, reply) => {
        const { slug, passivoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'get')
        const passivo = await app.patrimonioService.getPassivo(passivoId, organization.id)

        if (!passivo) {
          throw new BadRequestError('Passivo patrimonial não encontrado.')
        }

        return reply.send(passivo)
      },
    )
    .put(
      '/organizations/:slug/financeiro/patrimonios/passivos/:passivoId',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Atualizar passivo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), passivoId: z.string().uuid() }),
          body: patrimonioPassivoUpdateSchema,
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, passivoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'update')
        const updated = await app.patrimonioService.updatePassivo(passivoId, request.body, organization.id)

        if (!updated) {
          throw new BadRequestError('Passivo patrimonial não encontrado.')
        }

        return reply.status(204).send()
      },
    )
    .delete(
      '/organizations/:slug/financeiro/patrimonios/passivos/:passivoId',
      {
        schema: {
          tags: ['Financeiro - Patrimônio'],
          summary: 'Excluir passivo patrimonial',
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string(), passivoId: z.string().uuid() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, passivoId } = request.params
        const organization = await getOrganizationContext(request, slug, 'delete')
        const deleted = await app.patrimonioService.deletePassivo(passivoId, organization.id)

        if (!deleted) {
          throw new BadRequestError('Passivo patrimonial não encontrado.')
        }

        return reply.status(204).send()
      },
    )
}
