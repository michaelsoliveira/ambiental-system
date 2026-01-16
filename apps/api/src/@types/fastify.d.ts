import 'fastify'

import type { Member, Organization } from '@prisma/client'
import { PessoaService } from '@/services/pessoa-service';
import { EstadoService } from '@/services/estado-service';
import { CentroCustoService } from '@/services/centro-custo-service';
import { CategoriaFinanceiraService } from '@/services/categoria-financeira-service';
import { ContaBancariaService } from '@/services/conta-bancaria-service';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    pessoaService: PessoaService;
    centroCustoService: CentroCustoService;
    categoriaFinanceiraService: CategoriaFinanceiraService;
    contaBancariaService: ContaBancariaService;
    // estadoService: EstadoService;
  }
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getUserMembership(
      slug: string,
    ): Promise<{ organization: Organization; membership: Member & { members_roles: any } }>
  }
}