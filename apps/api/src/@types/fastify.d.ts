import 'fastify'

import type { Member, Organization } from '@prisma/client'
import { PessoaService } from '@/services/pessoa-service';
import { EstadoService } from '@/services/estado-service';
import { CentroCustoService } from '@/services/centro-custo-service';
import { CategoriaFinanceiraService } from '@/services/categoria-financeira-service';
import { ContaBancariaService } from '@/services/conta-bancaria-service';
import { FuncionarioService } from '@/services/funcionario.service';
import { FolhaPagamentoService } from '@/services/folha-pagamento.service';
import { DashboardFinanceiroService } from '@/services/dashboard-financeiro.service';
import { CargoFuncionarioService } from '@/services/cargo-funcionario.service';
import { EmpresaService } from '@/services/empresa.service';

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
    funcionarioService: FuncionarioService;
    folhaPagamentoService: FolhaPagamentoService;
    dashboardFinanceiroService: DashboardFinanceiroService;
    cargoFuncionarioService: CargoFuncionarioService;
    empresaService: EmpresaService;
    // estadoService: EstadoService;
  }
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getUserMembership(
      slug: string,
    ): Promise<{ organization: Organization; membership: Member & { members_roles: any } }>
  }
}