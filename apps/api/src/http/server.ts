import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyJwt from "@fastify/jwt";
import { fastify } from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import { createAccount } from "./routes/common/auth/create-account";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import { env } from "@saas/env";

import { errorHandler } from '@/http/error-handler'
import { authenticateWithGithub } from '@/http/routes/common/auth/authenticate-with-github'
import { authenticateWithPassword } from '@/http/routes/common/auth/authenticate-with-password'
import { getProfile } from '@/http/routes/common/auth/get-profile'
import { requestPasswordRecover } from '@/http/routes/common/auth/request-password-recover'
import { resetPassword } from '@/http/routes/common/auth/reset-password'
import { getOrganizationBilling } from '@/http/routes/common/billing/get-organization-billing'
import { acceptInvite } from '@/http/routes/common/invites/accept-invite'
import { createInvite } from '@/http/routes/common/invites/create-invite'
import { getInvite } from '@/http/routes/common/invites/get-invite'
import { getPendingInvites } from '@/http/routes/common/invites/get-pending-invites'
import { rejectInvite } from '@/http/routes/common/invites/reject-invite'
import { revokeInvite } from '@/http/routes/common/invites/revoke-invite'
import { getMembers } from '@/http/routes/common/members/get-members'
import { removeMember } from '@/http/routes/common/members/remove-member'
import { updateMember } from '@/http/routes/common/members/update-member'
import { createOrganization } from '@/http/routes/common/orgs/create-organization'
import { getMembership } from '@/http/routes/common/orgs/get-membership'
import { getOrganization } from '@/http/routes/common/orgs/get-organization'
import { getOrganizations } from '@/http/routes/common/orgs/get-organizations'
import { shutdownOrganization } from '@/http/routes/common/orgs/shutdown-organization'
import { transferOrganization } from '@/http/routes/common/orgs/transfer-organization'
import { updateOrganization } from '@/http/routes/common/orgs/update-organization'
import { createParceiro } from '@/http/routes/financeiro/parceiro/create-parceiro'
import { deleteParceiro } from '@/http/routes/financeiro/parceiro/delete-parceiro'
import { getParceiro } from '@/http/routes/financeiro/parceiro/get-parceiro'
import { getParceiros } from '@/http/routes/financeiro/parceiro/get-parceiros'
import { updateParceiro } from '@/http/routes/financeiro/parceiro/update-parceiro'
import { getInvites } from './routes/common/invites/get-invites'
import { getRoles } from "./routes/common/auth/get-roles";
import { createContaBancaria } from "./routes/financeiro/conta-bancaria/create-conta";
import { deleteContaBancaria } from "./routes/financeiro/conta-bancaria/delete-conta";
import { getContaBancaria } from "./routes/financeiro/conta-bancaria/get-conta";
import { getContasBancarias } from "./routes/financeiro/conta-bancaria/get-contas";
import { updateContaBancaria } from "./routes/financeiro/conta-bancaria/update-conta";
import { createCentroCusto } from "./routes/financeiro/centro-custo/create-centro-custo";
import { deleteCentroCusto } from "./routes/financeiro/centro-custo/delete-centro-custo";
import { getCentroCusto } from "./routes/financeiro/centro-custo/get-centro-custo";
import { getCentrosCusto } from "./routes/financeiro/centro-custo/get-centros-custo";
import { updateCentroCusto } from "./routes/financeiro/centro-custo/update-centro-custo";
import { createCategoriaFinanceira } from "./routes/financeiro/categoria/create-categoria";
import { deleteCategoriaFinanceira } from "./routes/financeiro/categoria/delete-categoria";
import { getCategoriaFinanceira } from "./routes/financeiro/categoria/get-categoria";
import { getCategorias } from "./routes/financeiro/categoria/get-categorias";
import { updateCategoriaFinanceira } from "./routes/financeiro/categoria/update-categoria";
import { createPessoa } from "./routes/common/pessoa/create-pessoa";
import { deletePessoa } from "./routes/common/pessoa/delete-pessoa";
import { getPessoa } from "./routes/common/pessoa/get-pessoa";
import { getPessoas } from "./routes/common/pessoa/get-pessoas";
import { PessoaService } from "../services/pessoa-service";
import { getMunicipiosByEstado } from "./routes/common/estado/get-municipios-by-estado";
import { estadoRoutes } from "./routes/common/estado/get-estados";
import { createLancamento } from "./routes/financeiro/lancamento/create-lancamento";
import { deleteLancamento } from "./routes/financeiro/lancamento/delete-lancamento";
import { getLancamento } from "./routes/financeiro/lancamento/get-lancamento";
import { getLancamentos } from "./routes/financeiro/lancamento/get-lancamentos";
import { getLancamentosRelatorio } from "./routes/financeiro/lancamento/get-lancamentos-relatorio";
import { updateLancamento } from "./routes/financeiro/lancamento/update-lancamento";
import { CategoriaFinanceiraService } from "@/services/categoria-financeira-service";
import { CentroCustoService } from "@/services/centro-custo-service";
import { ContaBancariaService } from "@/services/conta-bancaria-service";
import { FuncionarioService } from "@/services/funcionario.service";
import { FolhaPagamentoService } from "@/services/folha-pagamento.service";
import { DashboardFinanceiroService } from "@/services/dashboard-financeiro.service";
import { CargoFuncionarioService } from "@/services/cargo-funcionario.service";
import { EmpresaService } from "@/services/empresa.service";
import multipart from '@fastify/multipart'
import { updatePessoa } from "./routes/common/pessoa/update-pessoa";
import { getLancamentoStatistics } from "./routes/financeiro/lancamento/lancamento-statistics";
import { asaasPaymentsWebhook } from "./routes/webhooks/asaas-payments";
import { getVeiculos } from "./routes/financeiro/frota/get-veiculos";
import { getVeiculo } from "./routes/financeiro/frota/get-veiculo";
import { createVeiculo } from "./routes/financeiro/frota/create-veiculo";
import { updateVeiculo } from "./routes/financeiro/frota/update-veiculo";
import { deleteVeiculo } from "./routes/financeiro/frota/delete-veiculo";
import { postAbastecimento } from "./routes/financeiro/frota/post-abastecimento";
import { postManutencao } from "./routes/financeiro/frota/post-manutencao";
import { postViagem } from "./routes/financeiro/frota/post-viagem";
import { putAbastecimento } from "./routes/financeiro/frota/put-abastecimento";
import { deleteAbastecimento } from "./routes/financeiro/frota/delete-abastecimento";
import { putManutencao } from "./routes/financeiro/frota/put-manutencao";
import { deleteManutencao } from "./routes/financeiro/frota/delete-manutencao";
import { putViagem } from "./routes/financeiro/frota/put-viagem";
import { deleteViagem } from "./routes/financeiro/frota/delete-viagem";
import { getDisponibilidades } from "./routes/financeiro/frota/get-disponibilidades";
import { postDisponibilidade } from "./routes/financeiro/frota/post-disponibilidade";
import { putDisponibilidade } from "./routes/financeiro/frota/put-disponibilidade";
import { deleteDisponibilidade } from "./routes/financeiro/frota/delete-disponibilidade";
import { createFuncionario } from "./routes/financeiro/funcionario/create-funcionario";
import { deleteFuncionario } from "./routes/financeiro/funcionario/delete-funcionario";
import { getFuncionario } from "./routes/financeiro/funcionario/get-funcionario";
import { getFuncionarios } from "./routes/financeiro/funcionario/get-funcionarios";
import { updateFuncionario } from "./routes/financeiro/funcionario/update-funcionario";
import { createFolhaPagamento } from "./routes/financeiro/folha-pagamento/create-folha-pagamento";
import { createFolhaPagamentoItem } from "./routes/financeiro/folha-pagamento/create-folha-pagamento-item";
import { getFolhaPagamento } from "./routes/financeiro/folha-pagamento/get-folha-pagamento";
import { getFolhasPagamento } from "./routes/financeiro/folha-pagamento/get-folhas-pagamento";
import { getFolhasPagamentoRelatorio } from "./routes/financeiro/folha-pagamento/get-folhas-pagamento-relatorio";
import { getRubricasFolha } from "./routes/financeiro/folha-pagamento/get-rubricas-folha";
import { deleteFolhaPagamentoItem } from "./routes/financeiro/folha-pagamento/delete-folha-pagamento-item";
import { closeFolhaPagamento } from "./routes/financeiro/folha-pagamento/close-folha-pagamento";
import { reopenFolhaPagamento } from "./routes/financeiro/folha-pagamento/reopen-folha-pagamento";
import { payFolhaPagamento } from "./routes/financeiro/folha-pagamento/pay-folha-pagamento";
import { unpayFolhaPagamento } from "./routes/financeiro/folha-pagamento/unpay-folha-pagamento";
import { getDashboardResumo } from "./routes/financeiro/dashboard/get-dashboard-resumo";
import { getDashboardSeries } from "./routes/financeiro/dashboard/get-dashboard-series";
import { getCargosFuncionario } from "./routes/financeiro/cargo-funcionario/get-cargos-funcionario";
import { createCargoFuncionario } from "./routes/financeiro/cargo-funcionario/create-cargo-funcionario";
import { getCargoFuncionario } from "./routes/financeiro/cargo-funcionario/get-cargo-funcionario";
import { updateCargoFuncionario } from "./routes/financeiro/cargo-funcionario/update-cargo-funcionario";
import { deleteCargoFuncionario } from "./routes/financeiro/cargo-funcionario/delete-cargo-funcionario";
import { getEmpresas } from "./routes/financeiro/empresa/get-empresas";
import { getEmpresa } from "./routes/financeiro/empresa/get-empresa";
import { createEmpresa } from "./routes/financeiro/empresa/create-empresa";
import { updateEmpresa } from "./routes/financeiro/empresa/update-empresa";
import { deleteEmpresa } from "./routes/financeiro/empresa/delete-empresa";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.decorate('pessoaService', new PessoaService());
app.decorate('categoriaFinanceiraService', new CategoriaFinanceiraService());
app.decorate('centroCustoService', new CentroCustoService());
app.decorate('contaBancariaService', new ContaBancariaService());
app.decorate('funcionarioService', new FuncionarioService());
app.decorate('folhaPagamentoService', new FolhaPagamentoService());
app.decorate('dashboardFinanceiroService', new DashboardFinanceiroService());
app.decorate('cargoFuncionarioService', new CargoFuncionarioService());
app.decorate('empresaService', new EmpresaService());
// app.decorate('estadoService', new EstadoService());

app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Ambiental SaaS',
      description: 'Sistemas Integrados de Gestão Empresarial',
      version: '1.0.0'
    },
    servers: [],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  transform: jsonSchemaTransform
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs'
})

app.register(fastifyJwt, {
  secret: 'my-jwt-secret'
})
app.register(fastifyCors, {
  // origin: true,
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'https://ambiental.bomanejo.com.br', 'https://financeiro.bomanejo.com.br'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
});
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(authenticateWithGithub)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)
app.register(getRoles)

app.register(createOrganization)
app.register(getMembership)
app.register(getOrganization)
app.register(getOrganizations)
app.register(updateOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)

app.register(createPessoa)
app.register(deletePessoa)
app.register(getPessoa)
app.register(getPessoas)
app.register(updatePessoa)
app.register(getMunicipiosByEstado)
app.register(estadoRoutes)

app.register(createParceiro)
app.register(deleteParceiro)
app.register(getParceiro)
app.register(getParceiros)
app.register(updateParceiro)

app.register(createContaBancaria)
app.register(deleteContaBancaria)
app.register(getContaBancaria)
app.register(getContasBancarias)
app.register(updateContaBancaria)

app.register(createLancamento)
app.register(deleteLancamento)
app.register(getLancamento)
app.register(getLancamentos)
app.register(getLancamentosRelatorio)
app.register(updateLancamento)
app.register(getLancamentoStatistics)

app.register(getVeiculos)
app.register(getVeiculo)
app.register(createVeiculo)
app.register(updateVeiculo)
app.register(deleteVeiculo)
app.register(postAbastecimento)
app.register(postManutencao)
app.register(postViagem)
app.register(putAbastecimento)
app.register(deleteAbastecimento)
app.register(putManutencao)
app.register(deleteManutencao)
app.register(putViagem)
app.register(deleteViagem)
app.register(getDisponibilidades)
app.register(postDisponibilidade)
app.register(putDisponibilidade)
app.register(deleteDisponibilidade)
app.register(createFuncionario)
app.register(deleteFuncionario)
app.register(getFuncionario)
app.register(getFuncionarios)
app.register(updateFuncionario)
app.register(createFolhaPagamento)
app.register(getFolhasPagamento)
app.register(getRubricasFolha)
app.register(getFolhasPagamentoRelatorio)
app.register(getFolhaPagamento)
app.register(createFolhaPagamentoItem)
app.register(deleteFolhaPagamentoItem)
app.register(closeFolhaPagamento)
app.register(reopenFolhaPagamento)
app.register(payFolhaPagamento)
app.register(unpayFolhaPagamento)
app.register(getDashboardResumo)
app.register(getDashboardSeries)
app.register(getCargosFuncionario)
app.register(createCargoFuncionario)
app.register(getCargoFuncionario)
app.register(updateCargoFuncionario)
app.register(deleteCargoFuncionario)
app.register(getEmpresas)
app.register(getEmpresa)
app.register(createEmpresa)
app.register(updateEmpresa)
app.register(deleteEmpresa)

app.register(asaasPaymentsWebhook)

app.register(createCentroCusto)
app.register(deleteCentroCusto)
app.register(getCentroCusto)
app.register(getCentrosCusto)
app.register(updateCentroCusto)

app.register(createCategoriaFinanceira)
app.register(deleteCategoriaFinanceira)
app.register(getCategoriaFinanceira)
app.register(getCategorias)
app.register(updateCategoriaFinanceira)

app.register(getMembers)
app.register(updateMember)
app.register(removeMember)

app.register(createInvite)
app.register(getInvite)
app.register(getInvites)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(revokeInvite)
app.register(getPendingInvites)

app.register(getOrganizationBilling)


app.listen({ port: env.SERVER_PORT, host: "0.0.0.0" }).then(() => {
  console.log(`HTTP server running on http://0.0.0.0:${env.SERVER_PORT}`);
});

export default app;