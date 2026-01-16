import { prisma } from '@/lib/prisma'
import { ListQuery, buildOrderBy } from '@/utils/helpers'
import { z } from 'zod'

// CentroCusto Schemas
export const centroCustoCreateSchema = z.object({
    codigo: z.string().min(1, 'Código é obrigatório'),
    nome: z.string().min(1, 'Nome é obrigatório'),
    descricao: z.string().optional(),
    ativo: z.boolean().default(true),
  })

export type CentroCustoCreate = z.infer<typeof centroCustoCreateSchema>
export type CentroCustoUpdate = z.infer<typeof centroCustoUpdateSchema>

export const centroCustoUpdateSchema = centroCustoCreateSchema.partial()

export const centroCustoResponseSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  ativo: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const paginatedCentrosCustoSchema = z.object({
    data: z.array(centroCustoResponseSchema),
    pagination: z.object({
      count: z.number(),
      page: z.number(),
      limit: z.number(),
      total_pages: z.number(),
      has_next: z.boolean(),
      has_prev: z.boolean(),
    }),
  })

export class CentroCustoService {
    async getCentrosCustoPaginated(
      organizationId: string,
      params: ListQuery,
    ): Promise<z.infer<typeof paginatedCentrosCustoSchema>> {
      const {
        page = 1,
        limit = 50,
        search,
        orderBy = 'created_at',
        order = 'desc',
        ativo,
      } = params
  
      const where: any = {
        organization_id: organizationId,
        ...(ativo !== undefined && { ativo }),
      }
  
      if (search) {
        where.OR = [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ]
      }
  
      const orderByTerms = buildOrderBy(orderBy, order)
  
      const [centros, count] = await Promise.all([
        prisma.centroCusto.findMany({
          where,
          orderBy: orderByTerms.length > 0 ? orderByTerms : undefined,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.centroCusto.count({ where }),
      ])
  
      const total_pages = Math.ceil(count / limit)
  
      return {
        data: centros.map(c => this.serializeCentroCusto(c)),
        pagination: {
          count,
          page,
          limit,
          total_pages,
          has_next: page < total_pages,
          has_prev: page > 1,
        },
      }
    }
  
    async getCentroCustoById(
      id: string,
      organizationId: string,
    ): Promise<z.infer<typeof centroCustoResponseSchema> | null> {
      const centro = await prisma.centroCusto.findFirst({
        where: { id, organization_id: organizationId },
      })
  
      return centro ? this.serializeCentroCusto(centro) : null
    }
  
    async createCentroCusto(
      data: CentroCustoCreate,
      organizationId: string,
    ): Promise<string> {
      const centro = await prisma.centroCusto.create({
        data: {
          ...data,
          organization_id: organizationId,
        },
      })
  
      return centro.id
    }
  
    async updateCentroCusto(
      id: string,
      data: CentroCustoUpdate,
      organizationId: string,
    ): Promise<string | null> {
      const centro = await prisma.centroCusto.findFirst({
        where: { id, organization_id: organizationId },
      })
  
      if (!centro) return null
  
      await prisma.centroCusto.update({
        where: { id },
        data,
      })
  
      return id
    }
  
    async deleteCentroCusto(id: string, organizationId: string): Promise<boolean> {
      const centro = await prisma.centroCusto.findFirst({
        where: { id, organization_id: organizationId },
      })
  
      if (!centro) return false
  
      await prisma.centroCusto.delete({ where: { id } })
      return true
    }
  
    private serializeCentroCusto(centro: any): z.infer<typeof centroCustoResponseSchema> {
      return {
        id: centro.id,
        codigo: centro.codigo,
        nome: centro.nome,
        descricao: centro.descricao,
        ativo: centro.ativo,
        created_at: centro.created_at,
        updated_at: centro.updated_at,
      }
    }
  }