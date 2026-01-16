// lib/prisma-middleware.ts
import { Prisma, PrismaClient } from '@prisma/client';

export function organizationMiddleware(organizationId: string) {
  return async (
    params: any,
    next: (params: any) => Promise<any>
  ) => {
    // Modelos que precisam de filtragem
    const modelsToFilter = [
      'Pessoa',
      'PessoaFisica',
      'PessoaJuridica',
      'Parceiro',
      'Lancamento',
      'ContaBancaria',
      'CentroCusto',
      'CategoriaFinanceira',
      'Funcionario',
    ];

    if (modelsToFilter.includes(params.model ?? '')) {
      // READ operations
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where = {
          ...params.args.where,
          organization_id: organizationId,
        };
      }

      if (params.action === 'findMany') {
        params.args.where = {
          ...params.args.where,
          organization_id: organizationId,
        };
      }

      // WRITE operations
      if (params.action === 'create') {
        params.args.data = {
          ...params.args.data,
          organization_id: organizationId,
        };
      }

      if (params.action === 'createMany') {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            organization_id: organizationId,
          }));
        }
      }

      if (params.action === 'update' || params.action === 'updateMany') {
        params.args.where = {
          ...params.args.where,
          organization_id: organizationId,
        };
      }

      if (params.action === 'upsert') {
        params.args.where = {
          ...params.args.where,
          organization_id: organizationId,
        };
        params.args.create = {
          ...params.args.create,
          organization_id: organizationId,
        };
      }

      // DELETE operations
      if (params.action === 'delete' || params.action === 'deleteMany') {
        params.args.where = {
          ...params.args.where,
          organization_id: organizationId,
        };
      }
    }

    return next(params);
  };
}