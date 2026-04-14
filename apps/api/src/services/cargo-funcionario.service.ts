import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export const cargoFuncionarioCreateSchema = z.object({
  codigo: z.string().max(50).optional(),
  nome: z.string().min(1).max(120),
  descricao: z.string().optional(),
  salario_base: z.coerce.number().nonnegative(),
  ativo: z.boolean().default(true),
})

export const cargoFuncionarioUpdateSchema = cargoFuncionarioCreateSchema.partial()

export class CargoFuncionarioService {
  async list(organizationId: string, params: Record<string, any>) {
    const page = Number(params.page || 1)
    const limit = Math.min(Number(params.limit || 50), 100)
    const skip = (page - 1) * limit
    const where: any = {
      organization_id: organizationId,
      ...(params.ativo !== undefined ? { ativo: params.ativo } : {}),
      ...(params.search
        ? {
            OR: [
              { nome: { contains: params.search, mode: 'insensitive' } },
              { codigo: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [data, count] = await Promise.all([
      (prisma as any).cargoFuncionario.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
      }),
      (prisma as any).cargoFuncionario.count({ where }),
    ])
    return {
      data: data.map((item: any) => ({ ...item, salario_base: Number(item.salario_base) })),
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

  async create(organizationId: string, data: z.infer<typeof cargoFuncionarioCreateSchema>) {
    const created = await (prisma as any).cargoFuncionario.create({
      data: { ...data, organization_id: organizationId },
    })
    return created.id
  }

  async getById(organizationId: string, id: string) {
    return (prisma as any).cargoFuncionario.findFirst({
      where: { id, organization_id: organizationId },
    })
  }

  async update(
    organizationId: string,
    id: string,
    data: z.infer<typeof cargoFuncionarioUpdateSchema>,
  ) {
    const found = await this.getById(organizationId, id)
    if (!found) return null

    await (prisma as any).cargoFuncionario.update({
      where: { id },
      data,
    })

    return id
  }

  async delete(organizationId: string, id: string) {
    const found = await this.getById(organizationId, id)
    if (!found) return false

    await (prisma as any).cargoFuncionario.delete({ where: { id } })
    return true
  }
}
