import { z } from 'zod'

import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { prisma } from '@/lib/prisma'

export const empresaCreateSchema = z.object({
  pessoa_id: z.string().uuid(),
})

export const empresaUpdateSchema = empresaCreateSchema.partial()

export class EmpresaService {
  async list(organizationId: string, params: Record<string, any>) {
    const page = Number(params.page || 1)
    const limit = Math.min(Number(params.limit || 50), 100)
    const skip = (page - 1) * limit
    const search = params.search?.trim()

    const where: any = {
      organization_id: organizationId,
      ...(search
        ? {
            OR: [
              { pessoa: { fisica: { nome: { contains: search, mode: 'insensitive' } } } },
              { pessoa: { juridica: { nome_fantasia: { contains: search, mode: 'insensitive' } } } },
              { pessoa: { juridica: { razao_social: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    }

    const [data, count] = await Promise.all([
      (prisma as any).empresa.findMany({
        where,
        include: {
          pessoa: { include: { fisica: true, juridica: true } },
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).empresa.count({ where }),
    ])

    return {
      data,
      pagination: {
        count,
        page,
        limit,
        total_pages: Math.ceil(count / limit),
        has_next: page * limit < count,
        has_prev: page > 1,
      },
    }
  }

  async getById(organizationId: string, id: string) {
    return (prisma as any).empresa.findFirst({
      where: { id, organization_id: organizationId },
      include: { pessoa: { include: { fisica: true, juridica: true } } },
    })
  }

  async create(organizationId: string, data: z.infer<typeof empresaCreateSchema>) {
    const pessoa = await (prisma as any).pessoa.findFirst({
      where: { id: data.pessoa_id, organization_id: organizationId, deleted_at: null },
    })
    if (!pessoa) throw new BadRequestError('Pessoa não encontrada.')

    const exists = await (prisma as any).empresa.findFirst({
      where: { pessoa_id: data.pessoa_id, organization_id: organizationId },
    })
    if (exists) throw new BadRequestError('Já existe empresa para essa pessoa.')

    const created = await (prisma as any).empresa.create({
      data: { organization_id: organizationId, pessoa_id: data.pessoa_id },
    })
    return created.id
  }

  async update(organizationId: string, id: string, data: z.infer<typeof empresaUpdateSchema>) {
    const found = await (prisma as any).empresa.findFirst({
      where: { id, organization_id: organizationId },
    })
    if (!found) return null

    if (data.pessoa_id) {
      const pessoa = await (prisma as any).pessoa.findFirst({
        where: { id: data.pessoa_id, organization_id: organizationId, deleted_at: null },
      })
      if (!pessoa) throw new BadRequestError('Pessoa não encontrada.')
    }

    await (prisma as any).empresa.update({
      where: { id },
      data,
    })
    return id
  }

  async delete(organizationId: string, id: string) {
    const found = await (prisma as any).empresa.findFirst({
      where: { id, organization_id: organizationId },
    })
    if (!found) return false

    await (prisma as any).empresa.delete({ where: { id } })
    return true
  }
}
