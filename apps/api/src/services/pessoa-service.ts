import { prisma } from '@/lib/prisma';
import { buildOrderBy } from '@/utils/helpers';
import { z } from 'zod';

type optionFieldMinType = {
  field: string,
  min?: number | null,
  type?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalFieldMin = ({ field, min, type = "string" }: optionFieldMinType) => {
  switch(type) {
    case "string": 
      return z.string()
        .optional()
        .refine((val) => !val || val.length >= min!, {
          message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
        });
    case "number":
      return z.literal("")
      .transform(() => undefined)
      .or(z.number().transform((value: any) => value ?? NaN))
      .or(z.coerce.number().positive());
    case "email": 
      return z.string()
          .optional()
          .refine(
            (val) => !val || val.length >= min!, {
            message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
          }).refine((val: any) => !val || emailRegex.test(val), {
            message: "O email informado está inválido",
          })
    default:
      return z.string().optional()
        .refine((val) => !val || val.length >= min!, {
          message: `O campo '${field}' deve ter ao menos ${min} caracteres, se preenchido.`,
        })
  }
}

const enderecoSchema = z.object({
  id: z.string().uuid(),
  logradouro: optionalFieldMin({ field: 'logradouro', min: 5 }),
  numero: optionalFieldMin({ field: 'numero', min: 1 }),
  complemento: z.string().nullable(),
  bairro: optionalFieldMin({ field: 'bairro', min: 5 }),
  municipio_id: z.string().optional(),
  estado_id: z.string().optional(),
  municipio_nome: z.string().nullable().optional(),
  estado_nome: z.string().nullable().optional(),
  cep: optionalFieldMin({ field: 'cep', min: 5 }),
  created_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime().nullable(),
});

const enderecoCreateSchema = enderecoSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

const enderecoUpdateSchema = enderecoCreateSchema.partial();

// Schemas para Pessoa Física
const pessoaFisicaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  rg: z.string().nullable().optional(),
  data_nascimento: z.string().nullable().optional()
});

const pessoaFisicaCreateSchema = pessoaFisicaSchema;
const pessoaFisicaUpdateSchema = pessoaFisicaSchema.partial();

// Schemas para Pessoa Jurídica
const pessoaJuridicaSchema = z.object({
  nome_fantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  razao_social: optionalFieldMin({ field: 'razao_social', min: 5 }),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  data_abertura: z.string().nullable().optional(),
  inscricao_estadual: z.string().nullable().optional(),
  inscricao_municipal: z.string().nullable().optional()
});

const pessoaJuridicaCreateSchema = pessoaJuridicaSchema;
const pessoaJuridicaUpdateSchema = pessoaJuridicaSchema.partial();

// Schema para usuário relacionado
const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
});

// Schema de criação de Pessoa - COM DISCRIMINATEDUNION
const pessoaCreateSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('F'),
    email: optionalFieldMin({ field: 'email', type: 'email', min: 5 }),
    telefone: optionalFieldMin({ field: 'telefone', min: 6 }),
    endereco: enderecoCreateSchema.optional(),
    fisica: pessoaFisicaCreateSchema,
    juridica: z.never().optional(),
  }),
  z.object({
    tipo: z.literal('J'),
    email: optionalFieldMin({ field: 'email', type: 'email', min: 5 }),
    telefone: optionalFieldMin({ field: 'telefone', min: 6 }),
    endereco: enderecoCreateSchema.optional(),
    fisica: z.never().optional(),
    juridica: pessoaJuridicaCreateSchema,
  }),
]);

// Schema de atualização de Pessoa
const pessoaUpdateSchema = z.object({
  tipo: z.enum(['F', 'J']).optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  telefone: z.string().nullable().optional(),
  endereco: enderecoUpdateSchema.optional(),
  fisica: pessoaFisicaUpdateSchema.optional(),
  juridica: pessoaJuridicaUpdateSchema.optional(),
});

// Schema de resposta de Pessoa
const pessoaResponseSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(['F', 'J']),
  pessoa_nome: z.string().nullable(),
  email: z.string().email().nullable(),
  telefone: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  endereco: enderecoSchema.nullable(),
  fisica: z
    .object({
      nome: z.string(),
      cpf: z.string(),
      rg: z.string().nullable(),
      data_nascimento: z.string().datetime().nullable(),
    })
    .nullable(),
  juridica: z
    .object({
      nome_fantasia: z.string(),
      razao_social: z.string(),
      cnpj: z.string(),
      data_abertura: z.string().datetime().nullable(),
      inscricao_estadual: z.string().nullable(),
      inscricao_municipal: z.string().nullable(),
    })
    .nullable(),
  created_by_user_id: z.string().uuid(),
  created_by_user: userSchema.nullable(),
});

// Schema para listagem paginada
const paginatedPessoasSchema = z.object({
  data: z.array(pessoaResponseSchema),
  pagination: z.object({
    count: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total_pages: z.number().int().nonnegative(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
  }),
});

// Schema para query parameters de listagem
const getPessoasQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().optional(),
    orderBy: z.enum(['created_at', 'updated_at', 'email', 'tipo', 'nome']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
    tipo: z.string().optional(),
    organization_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
  });

// Tipos inferidos
export type PessoaCreate = z.infer<typeof pessoaCreateSchema>;
export type PessoaUpdate = z.infer<typeof pessoaUpdateSchema>;
export type PessoaResponse = z.infer<typeof pessoaResponseSchema>;
export type GetPessoasQuery = z.infer<typeof getPessoasQuerySchema>;
export type PaginatedPessoasResponse = z.infer<typeof paginatedPessoasSchema>;
export type EnderecoCreate = z.infer<typeof enderecoCreateSchema>;
export type EnderecoUpdate = z.infer<typeof enderecoUpdateSchema>;
export type PessoaFisicaCreate = z.infer<typeof pessoaFisicaCreateSchema>;
export type PessoaJuridicaCreate = z.infer<typeof pessoaJuridicaCreateSchema>;

export {
  pessoaCreateSchema,
  pessoaUpdateSchema,
  pessoaResponseSchema,
  paginatedPessoasSchema,
  getPessoasQuerySchema,
  enderecoCreateSchema,
  enderecoUpdateSchema,
  pessoaFisicaCreateSchema,
  pessoaJuridicaCreateSchema,
};

export class PessoaService {
  async getPessoasPaginated(params: GetPessoasQuery): Promise<PaginatedPessoasResponse> {
    const {
      page = 1,
      limit = 50,
      search,
      orderBy = 'created_at',
      order = 'desc',
      tipo,
      organization_id,
      user_id,
    } = params;

    try {
      const where: any = {
        organization_id
      };

      if (user_id) {
        where.created_by_user_id = user_id;
      }

      if (tipo) {
        where.tipo = tipo;
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search } },
          { fisica: { nome: { contains: search, mode: 'insensitive' } } },
          { fisica: { cpf: { equals: search } } },
          { juridica: { nome_fantasia: { contains: search, mode: 'insensitive' } } },
          { juridica: { cnpj: { equals: search } } },
        ];
      }

      const orderByTerms = buildOrderBy(orderBy, order)

      const [pessoas, count] = await Promise.all([
        prisma.pessoa.findMany({
          where,
          include: {
            fisica: true,
            juridica: true,
            endereco: {
              include: {
                municipio: true,
                estado: true,
              },
            },
            created_by_user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: orderByTerms.length > 0 ? orderByTerms : undefined,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.pessoa.count({ where }),
      ]);

      const total_pages = Math.ceil(count / limit);

      return {
        data: pessoas.map((p) => this.serializePessoa(p)),
        pagination: {
          count,
          page,
          limit,
          total_pages,
          has_next: page < total_pages,
          has_prev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Erro ao buscar pessoas: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPessoaById(id: string): Promise<PessoaResponse | null> {
    try {
      const pessoa = await prisma.pessoa.findFirst({
        where: {
          id
        },
        include: {
          fisica: true,
          juridica: true,
          endereco: {
            include: {
              municipio: true,
              estado: true,
            },
          },
          created_by_user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (!pessoa) return null;

      return this.serializePessoa(pessoa);
    } catch (error) {
      throw new Error(`Erro ao buscar pessoa: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createPessoa(data: PessoaCreate & { organization_id: string }, userId: string): Promise<string> {
      try {
        // Usar transação para garantir atomicidade
        const pessoa = await prisma.$transaction(async (tx) => {
          // Criar endereço primeiro (se houver)
          let enderecoId: string | null = null;
    
          if (data.endereco) {
            const endereco = await tx.endereco.create({
              data: {
                logradouro: data.endereco.logradouro,
                numero: data.endereco.numero,
                complemento: data.endereco.complemento ?? null,
                bairro: data.endereco.bairro,
                cep: data.endereco.cep,
                estado_id: data.endereco.estado_id
                  ? Number(data.endereco.estado_id)
                  : null,
                municipio_id: data.endereco.municipio_id
                  ? Number(data.endereco.municipio_id)
                  : null,
              },
            });
            enderecoId = endereco.id;
          }
    
          // Criar pessoa com referência ao endereço
          const novaPessoa = await tx.pessoa.create({
            data: {
              tipo: data.tipo,
              email: data.email ?? null,
              telefone: data.telefone ?? null,
              endereco_id: enderecoId,
              created_by_user_id: userId,
              organization_id: data.organization_id,
              ...(data.tipo === 'F' &&
                data.fisica && {
                  fisica: {
                    create: {
                      nome: data.fisica.nome,
                      cpf: data.fisica.cpf,
                      rg: data.fisica.rg ?? null,
                      data_nascimento: data.fisica.data_nascimento
                        ? new Date(data.fisica.data_nascimento)
                        : null,
                      organization_id: data.organization_id
                    },
                  },
                }),
              // Criar pessoa jurídica
              ...(data.tipo === 'J' &&
                data.juridica && {
                  juridica: {
                    create: {
                      nome_fantasia: data.juridica.nome_fantasia,
                      razao_social: data.juridica.razao_social,
                      cnpj: data.juridica.cnpj,
                      data_abertura: data.juridica.data_abertura
                        ? new Date(data.juridica.data_abertura)
                        : null,
                      inscricao_estadual:
                        data.juridica.inscricao_estadual ?? null,
                      inscricao_municipal:
                        data.juridica.inscricao_municipal ?? null,
                      organization_id: data.organization_id
                    },
                  },
                }),
            },
            include: {
              fisica: true,
              juridica: true,
              endereco: {
                include: {
                  estado: true,
                  municipio: true,
                },
              },
              created_by_user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          });
    
          return novaPessoa;
        });
    
        return pessoa.id;
      } catch (error) {
        throw new Error(
          `Erro ao criar pessoa: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    async updatePessoa(
      id: string, 
      data: PessoaUpdate, 
      organizationId: string
    ): Promise<string | null> {
      try {
        return await prisma.$transaction(async (tx) => {
          // Buscar pessoa existente
          const pessoa = await tx.pessoa.findFirst({
            where: {
              id,
              organization_id: organizationId,
            },
            include: {
              fisica: true,
              juridica: true,
              endereco: true,
            },
          });
  
          if (!pessoa) return null;
  
          const updateData: any = {};
  
          // Atualizar campos comuns
          if (data.email !== undefined) {
            updateData.email = data.email;
          }
  
          if (data.telefone !== undefined) {
            updateData.telefone = data.telefone;
          }
  
          // Atualizar endereço
          if (data.endereco) {
            if (pessoa.endereco_id) {
              // Atualizar endereço existente
              await tx.endereco.update({
                where: { id: pessoa.endereco_id },
                data: {
                  logradouro: data.endereco.logradouro,
                  numero: data.endereco.numero,
                  complemento: data.endereco.complemento ?? null,
                  bairro: data.endereco.bairro,
                  cep: data.endereco.cep,
                  estado_id: data.endereco.estado_id
                    ? Number(data.endereco.estado_id)
                    : null,
                  municipio_id: data.endereco.municipio_id
                    ? Number(data.endereco.municipio_id)
                    : null,
                },
              });
            } else {
              // Criar novo endereço
              const novoEndereco = await tx.endereco.create({
                data: {
                  logradouro: data.endereco.logradouro ?? '',
                  numero: data.endereco.numero ?? '',
                  complemento: data.endereco.complemento ?? null,
                  bairro: data.endereco.bairro ?? '',
                  cep: data.endereco.cep ?? '',
                  estado_id: data.endereco.estado_id
                    ? Number(data.endereco.estado_id)
                    : null,
                  municipio_id: data.endereco.municipio_id
                    ? Number(data.endereco.municipio_id)
                    : null,
                },
              });
              updateData.endereco_id = novoEndereco.id;
            }
          }
  
          // Atualizar pessoa física
          if (data.fisica && pessoa.tipo === 'F') {
            await tx.pessoaFisica.update({
              where: { pessoa_id: id },
              data: {
                nome: data.fisica.nome,
                cpf: data.fisica.cpf,
                rg: data.fisica.rg ?? null,
                data_nascimento: data.fisica.data_nascimento
                  ? new Date(data.fisica.data_nascimento)
                  : null,
              },
            });
          }
  
          // Atualizar pessoa jurídica
          if (data.juridica && pessoa.tipo === 'J') {
            await tx.pessoaJuridica.update({
              where: { pessoa_id: id },
              data: {
                nome_fantasia: data.juridica.nome_fantasia,
                razao_social: data.juridica.razao_social,
                cnpj: data.juridica.cnpj,
                data_abertura: data.juridica.data_abertura
                  ? new Date(data.juridica.data_abertura)
                  : null,
                inscricao_estadual: data.juridica.inscricao_estadual ?? null,
                inscricao_municipal: data.juridica.inscricao_municipal ?? null,
              },
            });
          }
  
          // Atualizar pessoa principal
          await tx.pessoa.update({
            where: { id },
            data: updateData,
          });
  
          return id;
        });
      } catch (error) {
        throw new Error(
          `Erro ao atualizar pessoa: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

  async deletePessoa(id: string): Promise<boolean> {
    try {
      const pessoa = await prisma.pessoa.findFirst({
        where: {
          id,
        },
      });

      if (!pessoa) return false;

      await prisma.pessoa.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar pessoa:', error);
      return false;
    }
  }

  private serializePessoa(pessoa: any): PessoaResponse {
    return {
      id: pessoa.id,
      tipo: pessoa.tipo,
      email: pessoa.email ?? null,
      telefone: pessoa.telefone ?? null,
      created_at: pessoa.created_at?.toISOString() ?? new Date().toISOString(),
      updated_at: pessoa.updated_at?.toISOString() ?? new Date().toISOString(),
      pessoa_nome: pessoa.tipo === 'F' ? pessoa.fisica.nome : pessoa.juridica.nome_fantasia,
      endereco: pessoa.endereco
        ? {
            id: pessoa.endereco.id,
            logradouro: pessoa.endereco.logradouro,
            numero: pessoa.endereco.numero,
            complemento: pessoa.endereco.complemento,
            bairro: pessoa.endereco.bairro,
            municipio_id: pessoa.endereco.municipio?.id,
            estado_id: pessoa.endereco.estado?.id,
            municipio_nome: pessoa.endereco.municipio ? pessoa.endereco.municipio.nome : null,
            estado_nome: pessoa.endereco.estado ? pessoa.endereco.estado.nome : null,
            cep: pessoa.endereco.cep,
            created_at: pessoa.endereco.created_at?.toISOString() ?? null,
            updated_at: pessoa.endereco.updated_at?.toISOString() ?? null,
          }
        : null,
      fisica: pessoa.fisica
        ? {
            nome: pessoa.fisica.nome,
            cpf: pessoa.fisica.cpf,
            rg: pessoa.fisica.rg,
            data_nascimento: pessoa.fisica.data_nascimento?.toISOString() ?? null,
          }
        : null,
      juridica: pessoa.juridica
        ? {
            nome_fantasia: pessoa.juridica.nome_fantasia,
            razao_social: pessoa.juridica.razao_social,
            cnpj: pessoa.juridica.cnpj,
            data_abertura: pessoa.juridica.data_abertura?.toISOString() ?? null,
            inscricao_estadual: pessoa.juridica.inscricao_estadual,
            inscricao_municipal: pessoa.juridica.inscricao_municipal,
          }
        : null,
      created_by_user_id: pessoa.created_by_user_id,
      created_by_user: pessoa.created_by_user
        ? {
            id: pessoa.created_by_user.id,
            username: pessoa.created_by_user.username,
            email: pessoa.created_by_user.email,
          }
        : null,
    };
  }
}