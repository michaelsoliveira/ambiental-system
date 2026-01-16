import { prisma } from '@/lib/prisma'
import { ListQuery, buildOrderBy } from '@/utils/helpers'
import { z } from 'zod'

// CategoriaFinanceira Schemas
export const categoriaFinanceiraCreateSchema = z.object({
    codigo: z.string().min(1, 'Código é obrigatório'),
    nome: z.string().min(1, 'Nome é obrigatório'),
    descricao: z.string().optional(),
    tipo: z.enum(['RECEITA', 'DESPESA']),
    parent_id: z.string().uuid().optional(),
    ativo: z.boolean().default(true),
  });

export const categoriaFinanceiraUpdateSchema = categoriaFinanceiraCreateSchema.partial()

export const categoriaFinanceiraResponseSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  nivel: z.number(),
  parent_id: z.string().uuid().nullable(),
  ativo: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const paginatedCategoriasSchema = z.object({
    data: z.array(categoriaFinanceiraResponseSchema),
    pagination: z.object({
      count: z.number(),
      page: z.number(),
      limit: z.number(),
      total_pages: z.number(),
      has_next: z.boolean(),
      has_prev: z.boolean(),
    }),
  })

export type CategoriaFinanceiraCreate = z.infer<typeof categoriaFinanceiraCreateSchema>
export type CategoriaFinanceiraUpdate = z.infer<typeof categoriaFinanceiraUpdateSchema>

export class CategoriaFinanceiraService {
    async getCategoriasPaginated(
      organizationId: string,
      params: ListQuery & { tipo?: 'RECEITA' | 'DESPESA' },
    ): Promise<z.infer<typeof paginatedCategoriasSchema>> {
      const {
        page = 1,
        limit = 50,
        search,
        orderBy = 'created_at',
        order = 'desc',
        ativo,
        tipo,
      } = params
  
      const where: any = {
        organization_id: organizationId,
        ...(ativo !== undefined && { ativo }),
        ...(tipo && { tipo }),
      }
  
      if (search) {
        where.OR = [
          { codigo: { contains: search, mode: 'insensitive' } },
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ]
      }
  
      const orderByTerms = buildOrderBy(orderBy, order)
  
      const [categorias, count] = await Promise.all([
        prisma.categoriaFinanceira.findMany({
          where,
          orderBy: orderByTerms.length > 0 ? orderByTerms : undefined,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.categoriaFinanceira.count({ where }),
      ])
  
      const total_pages = Math.ceil(count / limit)
  
      return {
        data: categorias.map(c => this.serializeCategoriaFinanceira(c)),
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
  
    async getCategoriaById(
      id: string,
      organizationId: string,
    ): Promise<z.infer<typeof categoriaFinanceiraResponseSchema> | null> {
      const categoria = await prisma.categoriaFinanceira.findFirst({
        where: { id, organization_id: organizationId },
      })
  
      return categoria ? this.serializeCategoriaFinanceira(categoria) : null
    }
  
    async createCategoria(
      data: CategoriaFinanceiraCreate,
      organizationId: string,
    ): Promise<string> {
      const categoria = await prisma.categoriaFinanceira.create({
        data: {
          ...data,
          organization_id: organizationId,
        },
      })
  
      return categoria.id
    }
  
    async updateCategoria(
      id: string,
      data: CategoriaFinanceiraUpdate,
      organizationId: string,
    ): Promise<string | null> {
      const categoria = await prisma.categoriaFinanceira.findFirst({
        where: { id, organization_id: organizationId },
      })
  
      if (!categoria) return null
  
      await prisma.categoriaFinanceira.update({
        where: { id },
        data,
      })
  
      return id
    }
  
    async deleteCategoria(id: string, organizationId: string): Promise<boolean> {
      const categoria = await prisma.categoriaFinanceira.findFirst({
        where: { id, organization_id: organizationId },
      })
  
      if (!categoria) return false
  
      await prisma.categoriaFinanceira.delete({ where: { id } })
      return true
    }
  
    private serializeCategoriaFinanceira(
      categoria: any,
    ): z.infer<typeof categoriaFinanceiraResponseSchema> {
      return {
        id: categoria.id,
        codigo: categoria.codigo,
        nome: categoria.nome,
        descricao: categoria.descricao,
        tipo: categoria.tipo,
        nivel: categoria.nivel,
        parent_id: categoria.parent_id,
        ativo: categoria.ativo,
        created_at: categoria.created_at,
        updated_at: categoria.updated_at,
      }
    }
  }