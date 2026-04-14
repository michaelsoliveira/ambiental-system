import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'

export const funcionarioCreateSchema = z.object({
  pessoa_id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  cargo_id: z.string().uuid().optional(),
  matricula: z.string().max(50).optional(),
  departamento: z.string().max(120).optional(),
  data_admissao: z.string().optional(),
  data_demissao: z.string().optional(),
  tipo_contrato: z.enum(['CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO', 'APRENDIZ']).default('CLT'),
  ativo: z.boolean().default(true),
})

export const funcionarioUpdateSchema = funcionarioCreateSchema.partial()

export class FuncionarioService {
  async list(organizationId: string, params: Record<string, any>) {
    const page = Number(params.page || 1)
    const limit = Math.min(Number(params.limit || 50), 100)
    const search = params.search?.trim()
    const skip = (page - 1) * limit

    const where: any = {
      organization_id: organizationId,
      ...(params.ativo !== undefined ? { ativo: params.ativo } : {}),
      ...(params.empresa_id ? { empresa_id: params.empresa_id } : {}),
      ...(params.cargo_id ? { cargo_id: params.cargo_id } : {}),
      ...(params.tipo_contrato ? { tipo_contrato: params.tipo_contrato } : {}),
      ...(search
        ? {
            OR: [
              { matricula: { contains: search, mode: 'insensitive' } },
              { cargo_funcionario: { nome: { contains: search, mode: 'insensitive' } } },
              { departamento: { contains: search, mode: 'insensitive' } },
              { pessoa: { fisica: { nome: { contains: search, mode: 'insensitive' } } } },
              { pessoa: { juridica: { nome_fantasia: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    }

    const [data, count] = await Promise.all([
      (prisma as any).funcionario.findMany({
        where,
        include: {
          pessoa: {
            include: {
              fisica: true,
              juridica: true,
            },
          },
          empresa: {
            include: {
              pessoa: {
                include: {
                  juridica: true,
                  fisica: true,
                },
              },
            },
          },
          cargo_funcionario: true,
        },
        orderBy: { id: 'desc' as const },
        skip,
        take: limit,
      }),
      (prisma as any).funcionario.count({ where }),
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

  async getById(id: string, organizationId: string) {
    const funcionario = await (prisma as any).funcionario.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        pessoa: { include: { fisica: true, juridica: true } },
        empresa: true,
        cargo_funcionario: true,
      },
    })

    if (!funcionario) return null

    return funcionario
  }

  async create(data: z.infer<typeof funcionarioCreateSchema>, organizationId: string) {
    const pessoa = await (prisma as any).pessoa.findFirst({
      where: { id: data.pessoa_id, organization_id: organizationId, deleted_at: null },
    })
    if (!pessoa) throw new BadRequestError('Pessoa não encontrada para a organização informada.')

    const empresa = await (prisma as any).empresa.findFirst({
      where: { id: data.empresa_id, organization_id: organizationId },
    })
    if (!empresa) throw new BadRequestError('Empresa não encontrada para a organização informada.')

    if (data.cargo_id) {
      const cargo = await (prisma as any).cargoFuncionario.findFirst({
        where: { id: data.cargo_id, organization_id: organizationId, ativo: true },
      })
      if (!cargo) throw new BadRequestError('Cargo não encontrado para a organização informada.')
    }

    const created = await (prisma as any).funcionario.create({
      data: {
        ...data,
        data_admissao: data.data_admissao ? new Date(data.data_admissao) : null,
        data_demissao: data.data_demissao ? new Date(data.data_demissao) : null,
        organization_id: organizationId,
      },
    })

    return created.id
  }

  async update(id: string, data: z.infer<typeof funcionarioUpdateSchema>, organizationId: string) {
    const found = await (prisma as any).funcionario.findFirst({
      where: { id, organization_id: organizationId },
    })
    if (!found) return null

    if (data.cargo_id) {
      const cargo = await (prisma as any).cargoFuncionario.findFirst({
        where: { id: data.cargo_id, organization_id: organizationId, ativo: true },
      })
      if (!cargo) throw new BadRequestError('Cargo não encontrado para a organização informada.')
    }

    await (prisma as any).funcionario.update({
      where: { id },
      data: {
        ...data,
        data_admissao: data.data_admissao ? new Date(data.data_admissao) : undefined,
        data_demissao: data.data_demissao ? new Date(data.data_demissao) : undefined,
      },
    })

    return id
  }

  async delete(id: string, organizationId: string) {
    const found = await (prisma as any).funcionario.findFirst({
      where: { id, organization_id: organizationId },
    })
    if (!found) return false
    await (prisma as any).funcionario.delete({ where: { id } })
    return true
  }
}
