import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/_errors/unauthorized-error'
import { omnichannelService } from '@/services/omnichannel/omnichannel.service'
import { getUserPermissions } from '@/utils/get-user-permissions'
import type { Role } from '@saas/auth'

const slugParams = z.object({ slug: z.string() })
const idParams = z.object({ slug: z.string(), id: z.string().uuid() })

type OcAction = 'get' | 'create' | 'update' | 'delete' | 'manage'

async function assertOmnichannelAccess(
  request: {
    getCurrentUserId(): Promise<string>
    getUserMembership(
      slug: string,
    ): Promise<{
      organization: { id: string }
      membership: { members_roles: { roles: { name: string } }[] }
    }>
  },
  slug: string,
  action: OcAction,
) {
  const userId = await request.getCurrentUserId()
  const { organization, membership } = await request.getUserMembership(slug)
  const { cannot } = getUserPermissions(
    userId,
    membership.members_roles.map((mr) => mr.roles.name as Role),
  )

  if (cannot(action, 'Omnichannel')) {
    throw new UnauthorizedError(
      'Você não tem permissão para acessar o omnichannel.',
    )
  }

  return { organization, userId }
}

export async function omnichannelRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>().register(auth)
  const base = '/organizations/:slug/omnichannel'

  // ── Canais ────────────────────────────────────────────────────────────────
  r.get(
    `${base}/canais`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listCanais(organization.id, request.params.slug)
    },
  )

  r.get(
    `${base}/canais/meta/webhook-url`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      await assertOmnichannelAccess(request, request.params.slug, 'get')
      return omnichannelService.webhookUrl()
    },
  )

  r.get(
    `${base}/canais/meta/landing-ingest-url`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      await assertOmnichannelAccess(request, request.params.slug, 'get')
      return omnichannelService.landingIngestMeta(request.params.slug)
    },
  )

  r.post(
    `${base}/canais`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.object({
          nome: z.string().min(1),
          tipo: z.string().min(1),
          ativo: z.boolean().optional(),
          ia_habilitada: z.boolean().optional(),
          config: z.record(z.string(), z.unknown()).optional(),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const canal = await omnichannelService.createCanal(
        organization.id,
        request.body,
      )
      return reply.status(201).send(canal)
    },
  )

  r.post(
    `${base}/canais/whatsapp`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.object({
          nome: z.string().min(1),
          token: z.string().optional(),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const canal = await omnichannelService.createWhatsapp(
        organization.id,
        request.body,
      )
      return reply.status(201).send(canal)
    },
  )

  r.post(
    `${base}/canais/landing-form`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.object({
          nome: z.string().min(1),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const canal = await omnichannelService.createLandingForm(
        organization.id,
        request.params.slug,
        request.body,
      )
      return reply.status(201).send(canal)
    },
  )

  r.get(
    `${base}/canais/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getCanal(
        organization.id,
        request.params.id,
        request.params.slug,
      )
    },
  )

  r.patch(
    `${base}/canais/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z
          .object({
            nome: z.string().optional(),
            tipo: z.string().optional(),
            ativo: z.boolean().optional(),
            ia_habilitada: z.boolean().optional(),
            config: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchCanal(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/canais/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteCanal(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  r.get(
    `${base}/canais/:id/qr`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.canalQr(organization.id, request.params.id)
    },
  )

  r.post(
    `${base}/canais/:id/sincronizar`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({}).passthrough().optional(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.canalSync(organization.id, request.params.id)
    },
  )

  r.post(
    `${base}/canais/:id/testar`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({}).passthrough().optional(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.canalTest(organization.id, request.params.id)
    },
  )

  // ── Contatos ──────────────────────────────────────────────────────────────
  r.get(
    `${base}/contatos`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        querystring: z.object({
          q: z.string().optional(),
          limit: z.coerce.number().int().optional(),
          offset: z.coerce.number().int().optional(),
        }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listContatos(organization.id, request.query)
    },
  )

  r.post(
    `${base}/contatos`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z
          .object({
            nome: z.string().optional(),
            telefone: z.string().optional(),
            email: z.string().optional(),
            avatar_url: z.string().optional(),
            tags: z.array(z.string()).optional(),
          })
          .passthrough(),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const contato = await omnichannelService.createContato(
        organization.id,
        request.body,
      )
      return reply.status(201).send(contato)
    },
  )

  r.get(
    `${base}/contatos/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getContato(organization.id, request.params.id)
    },
  )

  // ── Conversas ─────────────────────────────────────────────────────────────
  r.get(
    `${base}/conversas`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        querystring: z.object({
          status: z.string().optional(),
          statuses: z.string().optional(),
          canal_id: z.string().uuid().optional(),
          tag: z.string().optional(),
          tags: z.string().optional(),
          tipo_conversa: z.string().optional(),
          inbox_id: z.string().uuid().optional(),
          atribuicao: z.string().optional(),
          q: z.string().optional(),
          limit: z.coerce.number().int().optional(),
          offset: z.coerce.number().int().optional(),
        }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization, userId } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listConversas(organization.id, {
        ...request.query,
        currentUserId: userId,
      })
    },
  )

  r.get(
    `${base}/conversas/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getConversa(organization.id, request.params.id)
    },
  )

  r.patch(
    `${base}/conversas/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchConversa(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.post(
    `${base}/conversas/:id/encerrar`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({}).passthrough().optional(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.encerrarConversa(
        organization.id,
        request.params.id,
      )
    },
  )

  r.post(
    `${base}/conversas/:id/reabrir`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({}).passthrough().optional(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.reabrirConversa(
        organization.id,
        request.params.id,
      )
    },
  )

  r.post(
    `${base}/conversas/:id/marcar-lidas`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({}).passthrough().optional(),
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      await omnichannelService.marcarLidas(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  r.get(
    `${base}/conversas/:id/mensagens`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        querystring: z.object({
          limit: z.coerce.number().int().optional(),
        }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listMensagens(
        organization.id,
        request.params.id,
        request.query.limit,
      )
    },
  )

  r.post(
    `${base}/conversas/:id/mensagens`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({
          conteudo: z.string().min(1),
          destino: z.enum(['email', 'whatsapp']).optional(),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization, userId } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const msg = await omnichannelService.createMensagem(
        organization.id,
        request.params.id,
        userId,
        request.body.conteudo,
        { destino: request.body.destino },
      )
      return reply.status(201).send(msg)
    },
  )

  r.post(
    `${base}/conversas/:id/mensagens/anexo`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
      },
    },
    async (request, reply) => {
      const { organization, userId } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const file = await request.file()
      if (!file) {
        return reply.status(400).send({ message: 'Arquivo obrigatório' })
      }
      const buffer = await file.toBuffer()
      const legenda =
        typeof file.fields?.legenda === 'object' &&
        file.fields.legenda &&
        'value' in file.fields.legenda
          ? String((file.fields.legenda as { value: unknown }).value ?? '')
          : undefined
      const msg = await omnichannelService.createAnexo(
        organization.id,
        request.params.id,
        userId,
        {
          filename: file.filename,
          mimetype: file.mimetype,
          buffer,
        },
        legenda,
      )
      return reply.status(201).send(msg)
    },
  )

  r.get(
    `${base}/conversas/:conversaId/mensagens/:mensagemId/media`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          conversaId: z.string().uuid(),
          mensagemId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      try {
        const { buffer, mimetype, fileName } =
          await omnichannelService.getMensagemMedia(
            organization.id,
            request.params.conversaId,
            request.params.mensagemId,
          )

        // NÃO usar reply.hijack(): ele remove CORS do @fastify/cors e o
        // browser bloqueia o blob (imagem/PDF → "Não foi possível carregar").
        // Enviar Buffer com Content-Type binário evita o serializer Zod/JSON
        // (que transformaria em {"type":"Buffer","data":[...]}).
        const type = mimetype || 'application/octet-stream'
        if (fileName) {
          const safe = fileName.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180)
          reply.header(
            'Content-Disposition',
            `inline; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          )
        }
        return reply
          .header('Cache-Control', 'private, max-age=3600')
          .header('Content-Length', buffer.length)
          .type(type)
          .send(buffer)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Mídia não disponível'
        return reply.status(404).send({ message: msg })
      }
    },
  )

  r.post(
    `${base}/conversas/:id/notas-internas`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({ conteudo: z.string().min(1) }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization, userId } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const msg = await omnichannelService.createNotaInterna(
        organization.id,
        request.params.id,
        userId,
        request.body.conteudo,
      )
      return reply.status(201).send(msg)
    },
  )

  r.post(
    `${base}/conversas/:conversaId/automacoes/:automacaoId/executar`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          conversaId: z.string().uuid(),
          automacaoId: z.string().uuid(),
        }),
        body: z.object({}).passthrough().optional(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.executarAutomacao(
        organization.id,
        request.params.conversaId,
        request.params.automacaoId,
      )
    },
  )

  // ── Agentes ───────────────────────────────────────────────────────────────
  r.get(
    `${base}/agentes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listAgentes(organization.id)
    },
  )

  r.post(
    `${base}/agentes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z
          .object({
            nome: z.string().min(1),
            system_prompt: z.string(),
            descricao: z.string().optional(),
            tipo: z.string().optional(),
            categoria: z.string().optional(),
            modelo: z.string().optional(),
            temperatura: z.number().optional(),
            ativo: z.boolean().optional(),
            parent_id: z.string().uuid().nullable().optional(),
            departamento: z.string().optional(),
            squad: z.string().optional(),
            contexto_operacional: z.string().optional(),
            max_tokens: z.number().optional(),
            timeout_ms: z.number().optional(),
          })
          .passthrough(),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const agente = await omnichannelService.createAgente(
        organization.id,
        request.body,
      )
      return reply.status(201).send(agente)
    },
  )

  r.get(
    `${base}/agentes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getAgente(organization.id, request.params.id)
    },
  )

  r.patch(
    `${base}/agentes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchAgente(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/agentes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteAgente(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  r.get(
    `${base}/agentes/:id/skills`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listAgenteSkills(
        organization.id,
        request.params.id,
      )
    },
  )

  r.post(
    `${base}/agentes/:agenteId/skills/:skillId`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          agenteId: z.string().uuid(),
          skillId: z.string().uuid(),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      await omnichannelService.linkSkill(
        organization.id,
        request.params.agenteId,
        request.params.skillId,
      )
      return reply.status(201).send({ ok: true })
    },
  )

  r.delete(
    `${base}/agentes/:agenteId/skills/:skillId`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          slug: z.string(),
          agenteId: z.string().uuid(),
          skillId: z.string().uuid(),
        }),
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.unlinkSkill(
        organization.id,
        request.params.agenteId,
        request.params.skillId,
      )
      return reply.status(204).send()
    },
  )

  // ── Skills ────────────────────────────────────────────────────────────────
  r.get(
    `${base}/skills`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listSkills(organization.id)
    },
  )

  r.post(
    `${base}/skills`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z
          .object({
            nome: z.string().min(1),
            descricao_llm: z.string().min(1),
            categoria: z.string().optional(),
            tool_id: z.string().uuid().optional(),
            parameters_schema: z.record(z.string(), z.unknown()).optional(),
            invocation_config: z.record(z.string(), z.unknown()).optional(),
            instrucoes_extras: z.string().optional(),
            timeout_ms: z.number().optional(),
            ativo: z.boolean().optional(),
          })
          .passthrough(),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const skill = await omnichannelService.createSkill(
        organization.id,
        request.body,
      )
      return reply.status(201).send(skill)
    },
  )

  r.get(
    `${base}/skills/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getSkill(organization.id, request.params.id)
    },
  )

  r.patch(
    `${base}/skills/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchSkill(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/skills/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteSkill(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  // ── Tools ─────────────────────────────────────────────────────────────────
  r.get(
    `${base}/tools`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listTools(organization.id)
    },
  )

  r.post(
    `${base}/tools`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z
          .object({
            nome: z.string().min(1),
            tipo: z.string().min(1),
            descricao: z.string().optional(),
            config: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough(),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const tool = await omnichannelService.createTool(
        organization.id,
        request.body,
      )
      return reply.status(201).send(tool)
    },
  )

  r.get(
    `${base}/tools/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getTool(organization.id, request.params.id)
    },
  )

  r.patch(
    `${base}/tools/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchTool(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/tools/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteTool(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  // ── Pipelines ─────────────────────────────────────────────────────────────
  r.get(
    `${base}/pipelines`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listPipelines(organization.id)
    },
  )

  r.post(
    `${base}/pipelines`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.object({ nome: z.string().min(1) }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const pipeline = await omnichannelService.createPipeline(
        organization.id,
        request.body.nome,
      )
      return reply.status(201).send(pipeline)
    },
  )

  r.get(
    `${base}/pipelines/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getPipeline(organization.id, request.params.id)
    },
  )

  r.delete(
    `${base}/pipelines/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deletePipeline(
        organization.id,
        request.params.id,
      )
      return reply.status(204).send()
    },
  )

  r.get(
    `${base}/pipelines/:id/stages`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listStages(organization.id, request.params.id)
    },
  )

  r.post(
    `${base}/pipelines/:id/stages`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({
          nome: z.string().min(1),
          tipo: z.string().min(1),
          cor: z.string().min(1),
          ordem: z.number().int(),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const stage = await omnichannelService.createStage(
        organization.id,
        request.params.id,
        request.body,
      )
      return reply.status(201).send(stage)
    },
  )

  r.get(
    `${base}/pipelines/:id/cards`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listCards(organization.id, request.params.id)
    },
  )

  r.post(
    `${base}/pipelines/:id/cards`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({
          stage_id: z.string().uuid(),
          conversa_id: z.string().uuid().optional(),
          titulo: z.string().optional(),
          valor_estimado: z.number().optional(),
        }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const card = await omnichannelService.createCard(
        organization.id,
        request.params.id,
        request.body,
      )
      return reply.status(201).send(card)
    },
  )

  r.patch(
    `${base}/cards/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchCard(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/cards/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteCard(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  // ── Inboxes ───────────────────────────────────────────────────────────────
  r.get(
    `${base}/inboxes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listInboxes(organization.id)
    },
  )

  r.post(
    `${base}/inboxes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z
          .object({
            nome: z.string().min(1),
            icone: z.string().optional(),
            cor: z.string().optional(),
            filtros: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough(),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const inbox = await omnichannelService.createInbox(
        organization.id,
        request.body,
      )
      return reply.status(201).send(inbox)
    },
  )

  r.patch(
    `${base}/inboxes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z
          .object({
            nome: z.string().optional(),
            icone: z.string().optional(),
            cor: z.string().optional(),
            filtros: z.record(z.string(), z.unknown()).optional(),
          })
          .passthrough(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchInbox(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/inboxes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteInbox(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  // ── Automações ────────────────────────────────────────────────────────────
  r.get(
    `${base}/automacoes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listAutomacoes(organization.id)
    },
  )

  r.post(
    `${base}/automacoes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z
          .object({
            nome: z.string().min(1),
            trigger_tipo: z.string().min(1),
            descricao: z.string().optional(),
            condicoes: z.array(z.record(z.string(), z.unknown())).optional(),
            acoes: z.array(z.record(z.string(), z.unknown())).optional(),
            limite_rpm: z.number().optional(),
            ativa: z.boolean().optional(),
          })
          .passthrough(),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const row = await omnichannelService.createAutomacao(
        organization.id,
        request.body,
      )
      return reply.status(201).send(row)
    },
  )

  r.patch(
    `${base}/automacoes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchAutomacao(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/automacoes/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteAutomacao(
        organization.id,
        request.params.id,
      )
      return reply.status(204).send()
    },
  )

  // ── Tags ──────────────────────────────────────────────────────────────────
  r.get(
    `${base}/config/tags`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listTags(organization.id)
    },
  )

  r.post(
    `${base}/config/tags`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.object({ nome: z.string().min(1), cor: z.string().min(1) }),
        response: { 201: z.any() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      const tag = await omnichannelService.createTag(
        organization.id,
        request.body,
      )
      return reply.status(201).send(tag)
    },
  )

  r.patch(
    `${base}/config/tags/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: z.object({
          nome: z.string().optional(),
          cor: z.string().optional(),
        }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchTag(
        organization.id,
        request.params.id,
        request.body,
      )
    },
  )

  r.delete(
    `${base}/config/tags/:id`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: idParams,
        response: { 204: z.null().optional() },
      },
    },
    async (request, reply) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'delete',
      )
      await omnichannelService.deleteTag(organization.id, request.params.id)
      return reply.status(204).send()
    },
  )

  // ── Config IA ─────────────────────────────────────────────────────────────
  r.get(
    `${base}/config/ia`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getOrCreateConfigIA(organization.id)
    },
  )

  r.patch(
    `${base}/config/ia`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchConfigIA(organization.id, request.body)
    },
  )

  // ── Watchdog ──────────────────────────────────────────────────────────────
  r.get(
    `${base}/watchdog`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getOrCreateWatchdog(organization.id)
    },
  )

  r.patch(
    `${base}/watchdog`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        body: z.record(z.string(), z.unknown()),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'update',
      )
      return omnichannelService.patchWatchdog(organization.id, request.body)
    },
  )

  r.get(
    `${base}/watchdog/alertas`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listAlertas(organization.id)
    },
  )

  // ── Dashboard / Jarvis / Execuções ────────────────────────────────────────
  r.get(
    `${base}/dashboard`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        querystring: z.object({ periodo: z.string().optional() }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getDashboard(
        organization.id,
        request.query.periodo,
      )
    },
  )

  r.get(
    `${base}/jarvis/overview`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        querystring: z.object({ periodo: z.string().optional() }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.getJarvisOverview(
        organization.id,
        request.query.periodo,
      )
    },
  )

  r.get(
    `${base}/execucoes`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        querystring: z.object({
          dias: z.coerce.number().int().optional(),
          status: z.string().optional(),
          so_erros: z
            .union([z.literal('true'), z.literal('false'), z.boolean()])
            .optional()
            .transform((v) => v === true || v === 'true'),
        }),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'get',
      )
      return omnichannelService.listExecucoes(organization.id, request.query)
    },
  )

  r.post(
    `${base}/provision/ia-defaults`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        querystring: z.object({
          force: z
            .union([z.literal('true'), z.literal('false'), z.boolean()])
            .optional()
            .transform((v) => v === true || v === 'true'),
        }),
        body: z.object({}).passthrough().optional(),
        response: { 200: z.any() },
      },
    },
    async (request) => {
      const { organization } = await assertOmnichannelAccess(
        request,
        request.params.slug,
        'create',
      )
      return omnichannelService.provisionIaDefaults(
        organization.id,
        request.query.force,
      )
    },
  )

  r.get(
    `${base}/llm/providers`,
    {
      schema: {
        tags: ['Omnichannel'],
        security: [{ bearerAuth: [] }],
        params: slugParams,
        response: { 200: z.any() },
      },
    },
    async (request) => {
      await assertOmnichannelAccess(request, request.params.slug, 'get')
      return omnichannelService.listLlmProviders()
    },
  )
}
