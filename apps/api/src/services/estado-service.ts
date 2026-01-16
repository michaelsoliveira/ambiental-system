// services/estado.service.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schemas de validação
export const EstadoCreateSchema = z.object({
  uf: z.string().length(2).toUpperCase(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ibge: z.number().optional(),
  ddd: z.any().optional().nullable(),
});

export const EstadoUpdateSchema = z.object({
  uf: z.string().length(2).toUpperCase().optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  ibge: z.string().optional(),
  ddd: z.any().optional(),
});

export const MunicipioSchema = z.object({
  id: z.number().int(),
  nome: z.string(),
  ibge: z.number().optional().nullable(),
  estado_id: z.number().int(),
});

export const EstadoResponseSchema = z.object({
  id: z.number().int(),
  uf: z.string(),
  nome: z.string(),
  ibge: z.number().optional().nullable(),
  ddd: z.any().optional().nullable(),
  municipios_count: z.number().int(),
  municipios: z.array(MunicipioSchema).optional(),
});

export const PaginatedEstadosSchema = z.object({
  data: z.array(EstadoResponseSchema),
  pagination: z.object({
    count: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total_pages: z.number().int().nonnegative(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
  }),
});

export const GetEstadosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().nonnegative().default(10),
  search: z.string().optional(),
  order_by: z.enum(['id', 'nome', 'uf', 'ibge']).default('nome'),
  order: z.enum(['asc', 'desc']).default('asc'),
  include_municipios: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default(false),
});

export const GetMunicipiosQuerySchema = z.object({
  estado_id: z.coerce.number().int().positive('ID do estado inválido'),
  search: z.string().optional(),
  order_by: z.enum(['nome', 'ibge']).default('nome'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type EstadoCreate = z.infer<typeof EstadoCreateSchema>;
export type EstadoUpdate = z.infer<typeof EstadoUpdateSchema>;
export type EstadoResponse = z.infer<typeof EstadoResponseSchema>;
export type GetEstadosQuery = z.infer<typeof GetEstadosQuerySchema>;
export type GetMunicipiosQuery = z.infer<typeof GetMunicipiosQuerySchema>;
export type PaginatedEstadosResponse = z.infer<typeof PaginatedEstadosSchema>;

export class EstadoService {
  private static serializeEstado(
    estado: any,
    municipiosList?: any[],
    includeMunicipios: boolean = false
  ): EstadoResponse {
    const result: EstadoResponse = {
      id: estado.id,
      uf: estado.uf,
      nome: estado.nome,
      ibge: estado.ibge,
      ddd: estado.ddd,
      municipios_count: municipiosList?.length || 0,
    };

    if (includeMunicipios && municipiosList) {
      result.municipios = municipiosList.map((m) => ({
        id: m.id,
        nome: m.nome,
        ibge: m.ibge,
        estado_id: m.estado_id,
      }));
    }

    return result;
  }

  static async getEstadosPaginated(
    params: GetEstadosQuery
  ): Promise<PaginatedEstadosResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      order_by = 'nome',
      order = 'asc',
      include_municipios = false,
    } = params;

    const offset = (page - 1) * limit;

    try {
      // Construir where conditions
      const where: any = {};

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { uf: { contains: search.toUpperCase(), mode: 'insensitive' } },
        ];
      }

      // Contar total
      const totalCount = await prisma.estado.count({ where });

      // Buscar estados
      const estadosData = await prisma.estado.findMany({
        where,
        orderBy: {
          [order_by]: order,
        },
        skip: offset,
        take: limit,
      });

      // Buscar municípios se necessário
      let estadosWithMunicipios: EstadoResponse[] = [];

      if (include_municipios) {
        estadosWithMunicipios = await Promise.all(
          estadosData.map(async (estado) => {
            const municipiosList = await prisma.municipio.findMany({
              where: { estado_id: estado.id },
              orderBy: { nome: 'asc' },
            });

            return this.serializeEstado(estado, municipiosList, true);
          })
        );
      } else {
        estadosWithMunicipios = estadosData.map((e) =>
          this.serializeEstado(e, [], false)
        );
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: estadosWithMunicipios,
        pagination: {
          count: totalCount,
          page,
          limit,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        `Erro ao buscar estados: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getEstadoById(
    estadoId: number,
    includeMunicipios: boolean = false
  ): Promise<EstadoResponse | null> {
    try {
      const estado = await prisma.estado.findUnique({
        where: { id: estadoId },
      });

      if (!estado) return null;

      let municipiosList: any[] | undefined;
      if (includeMunicipios) {
        municipiosList = await prisma.municipio.findMany({
          where: { estado_id: estadoId },
          orderBy: { nome: 'asc' },
        });
      }

      return this.serializeEstado(estado, municipiosList, includeMunicipios);
    } catch (error) {
      throw new Error(
        `Erro ao buscar estado: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getEstadoByUf(
    uf: string,
    includeMunicipios: boolean = false
  ): Promise<EstadoResponse | null> {
    try {
      const estado = await prisma.estado.findFirst({
        where: { uf: uf.toUpperCase() },
      });

      if (!estado) return null;

      let municipiosList: any[] | undefined;
      if (includeMunicipios) {
        municipiosList = await prisma.municipio.findMany({
          where: { estado_id: estado.id },
          orderBy: { nome: 'asc' },
        });
      }

      return this.serializeEstado(estado, municipiosList, includeMunicipios);
    } catch (error) {
      throw new Error(
        `Erro ao buscar estado: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async getMunicipiosByEstadoId(
    params: GetMunicipiosQuery
  ): Promise<Array<z.infer<typeof MunicipioSchema>>> {
    try {
      const { estado_id, search, order_by = 'nome', order = 'asc' } = params;

      // Verificar se estado existe
      const estado = await prisma.estado.findUnique({
        where: { id: estado_id },
      });

      if (!estado) {
        throw new Error('Estado não encontrado');
      }

      // Construir where conditions
      const where: any = {
        estado_id,
      };

      if (search) {
        where.nome = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Buscar municípios
      const municipiosList = await prisma.municipio.findMany({
        where,
        orderBy: {
          [order_by]: order,
        },
      });

      return municipiosList.map((m) => ({
        id: m.id,
        nome: m.nome,
        ibge: m.ibge,
        estado_id: m.estado_id,
      }));
    } catch (error) {
      throw new Error(
        `Erro ao buscar municípios: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async createEstado(data: EstadoCreate): Promise<number> {
    try {
      // Verificar se já existe estado com a mesma UF
      const existing = await prisma.estado.findFirst({
        where: { uf: data.uf.toUpperCase() },
      });

      if (existing) {
        throw new Error(`Estado com UF '${data.uf}' já existe`);
      }

      const resultado = await prisma.estado.create({
        data: {
          uf: data.uf.toUpperCase(),
          nome: data.nome,
          ibge: data.ibge || null,
          ddd: data.ddd as any,
        },
      });

      return resultado.id;
    } catch (error) {
      throw new Error(
        `Erro ao criar estado: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async updateEstado(
    estadoId: number,
    data: EstadoUpdate
  ): Promise<number | null> {
    try {
      const estado = await prisma.estado.findUnique({
        where: { id: estadoId },
      });

      if (!estado) return null;

      // Verificar se UF já existe (se estiver sendo alterada)
      if (data.uf && data.uf.toUpperCase() !== estado.uf) {
        const existing = await prisma.estado.findFirst({
          where: { uf: data.uf.toUpperCase() },
        });

        if (existing) {
          throw new Error(`Estado com UF '${data.uf}' já existe`);
        }
      }

      const updateData: any = {};
      if (data.uf) updateData.uf = data.uf.toUpperCase();
      if (data.nome) updateData.nome = data.nome;
      if (data.ibge !== undefined) updateData.ibge = data.ibge || null;
      if (data.ddd !== undefined) updateData.ddd = data.ddd || null;

      await prisma.estado.update({
        where: { id: estadoId },
        data: updateData,
      });

      return estadoId;
    } catch (error) {
      throw new Error(
        `Erro ao atualizar estado: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  static async deleteEstado(estadoId: number): Promise<boolean> {
    try {
      const estado = await prisma.estado.findUnique({
        where: { id: estadoId },
      });

      if (!estado) return false;

      // Verificar se existem municípios associados
      const municipioCount = await prisma.municipio.count({
        where: { estado_id: estadoId },
      });

      if (municipioCount > 0) {
        throw new Error(
          'Não é possível deletar estado com municípios associados'
        );
      }

      await prisma.estado.delete({
        where: { id: estadoId },
      });

      return true;
    } catch (error) {
      throw new Error(
        `Erro ao deletar estado: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}