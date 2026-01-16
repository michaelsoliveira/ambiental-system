-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "common";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "financeiro";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "monitoramento";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "seguranca";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "common"."UserRole" AS ENUM ('MEMBER', 'ADMIN', 'OWNER', 'GUEST', 'BILLING');

-- CreateEnum
CREATE TYPE "common"."TokenType" AS ENUM ('PASSWORD_RECOVERY', 'EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "common"."tipo_pessoa" AS ENUM ('F', 'J');

-- CreateEnum
CREATE TYPE "monitoramento"."tipo_condicionante" AS ENUM ('monitoramento', 'relatorio', 'mitigadora', 'compensatoria', 'legal', 'outro');

-- CreateEnum
CREATE TYPE "monitoramento"."frenquencia_condicionante" AS ENUM ('unica', 'periodica', 'eventual', 'continua');

-- CreateEnum
CREATE TYPE "financeiro"."TipoParceiro" AS ENUM ('CLIENTE', 'FORNECEDOR', 'AMBOS');

-- CreateEnum
CREATE TYPE "financeiro"."TipoContaBancaria" AS ENUM ('CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'CREDITO');

-- CreateEnum
CREATE TYPE "financeiro"."TipoCategoria" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "financeiro"."TipoLancamento" AS ENUM ('RECEITA', 'DESPESA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "financeiro"."FormaParcelamento" AS ENUM ('UNICA', 'FIXA', 'PROGRESSIVA');

-- CreateEnum
CREATE TYPE "financeiro"."StatusLancamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'PAGO', 'CANCELADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "financeiro"."StatusParcela" AS ENUM ('PENDENTE', 'PAGA', 'CANCELADA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "financeiro"."TipoDocumento" AS ENUM ('NOTA_FISCAL', 'RECIBO', 'CUPOM', 'BOLETO', 'CHEQUE', 'OUTRO');

-- CreateEnum
CREATE TYPE "financeiro"."TipoContaPlano" AS ENUM ('ATIVA', 'PASSIVA', 'RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "financeiro"."TipoRelatorio" AS ENUM ('FLUXO_CAIXA', 'DRE', 'SALDO_CONTAS', 'CONTAS_A_RECEBER', 'CONTAS_A_PAGAR', 'LUCRO_PREJUIZO');

-- CreateTable
CREATE TABLE "common"."users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "username" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR,
    "provider" VARCHAR,
    "avatarUrl" VARCHAR,
    "email_verified" TIMESTAMP(3),
    "provider_id" VARCHAR,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."invites" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "role" "common"."UserRole" NOT NULL DEFAULT 'MEMBER',
    "email" VARCHAR NOT NULL,
    "token" VARCHAR NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "user_id" UUID,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."organizations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "domain" VARCHAR,
    "shouldAttachDomain" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" VARCHAR,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."permissions_roles" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "permissions_roles_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "common"."refresh_token" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "token" VARCHAR NOT NULL,
    "user_id" UUID,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."members_permissions" (
    "member_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "members_permissions_pkey" PRIMARY KEY ("member_id","permission_id")
);

-- CreateTable
CREATE TABLE "common"."members_roles" (
    "member_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "members_roles_pkey" PRIMARY KEY ("member_id","role_id")
);

-- CreateTable
CREATE TABLE "common"."verification_tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "token" TEXT NOT NULL,
    "type" "common"."TokenType" NOT NULL DEFAULT 'PASSWORD_RECOVERY',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sessionToken" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."parceiros" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "tipo" "financeiro"."TipoParceiro" NOT NULL,
    "cpfCnpj" VARCHAR(20),
    "inscricaoEstadual" VARCHAR(50),
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" VARCHAR(100),
    "estado" CHAR(2),
    "cep" VARCHAR(10),
    "telefone" VARCHAR(20),
    "celular" VARCHAR(20),
    "email" VARCHAR(100),
    "contato" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "parceiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."contas_bancarias" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "banco" VARCHAR(100) NOT NULL,
    "agencia" TEXT,
    "numero" TEXT,
    "digito" TEXT,
    "tipoConta" "financeiro"."TipoContaBancaria" NOT NULL,
    "saldoInicial" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldoAtual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "limiteCredito" DECIMAL(15,2),
    "dataAbertura" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."centros_custo" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "responsavel" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."categorias_financeiras" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "tipo" "financeiro"."TipoCategoria" NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "parent_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."plano_contas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "tipo" "financeiro"."TipoContaPlano" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "parent_id" UUID,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plano_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."lancamento" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "numero" VARCHAR(100) NOT NULL,
    "tipo" "financeiro"."TipoLancamento" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "data_vencimento" TIMESTAMP(3),
    "descricao" VARCHAR(500) NOT NULL,
    "observacoes" TEXT,
    "valor" DECIMAL(15,2) NOT NULL,
    "valor_pago" DECIMAL(15,2),
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "data_pagamento" TIMESTAMP(3),
    "forma_parcelamento" "financeiro"."FormaParcelamento" NOT NULL DEFAULT 'UNICA',
    "numero_parcelas" INTEGER NOT NULL DEFAULT 1,
    "status_lancamento" "financeiro"."StatusLancamento" NOT NULL DEFAULT 'PENDENTE',
    "categoria_id" UUID NOT NULL,
    "conta_bancaria_id" UUID NOT NULL,
    "centro_custo_id" UUID,
    "parceiro_id" UUID,
    "lancamento_transferencia_id" UUID,

    CONSTRAINT "lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."parcelas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lancamento_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "numero_parcela" INTEGER NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "valorPago" DECIMAL(15,2),
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "data_pagamento" TIMESTAMP(3),
    "status_parcela" "financeiro"."StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."documentos_financeiro" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lancamento_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "parceiro_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "tipo" "financeiro"."TipoDocumento" NOT NULL,
    "numero" VARCHAR(100) NOT NULL,
    "serie" VARCHAR(50),
    "data_documento" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "path" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "documentos_financeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."extratos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "conta_bancaria_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataExtrato" TIMESTAMP(3) NOT NULL,
    "saldoInicial" DECIMAL(15,2) NOT NULL,
    "saldoFinal" DECIMAL(15,2) NOT NULL,
    "totalEntradas" DECIMAL(15,2) NOT NULL,
    "totalSaidas" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "extratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."configuracoes_financeiras" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "moedaPadrao" TEXT NOT NULL DEFAULT 'BRL',
    "casasDecimais" INTEGER NOT NULL DEFAULT 2,
    "diasCarencia" INTEGER NOT NULL DEFAULT 0,
    "gerarDreAutomatico" BOOLEAN NOT NULL DEFAULT false,
    "permiteDesconto" BOOLEAN NOT NULL DEFAULT true,
    "permiteMulta" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "configuracoes_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."relatorios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "tipo" "financeiro"."TipoRelatorio" NOT NULL,
    "descricao" TEXT,
    "filtros" TEXT,

    CONSTRAINT "relatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."pessoas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "common"."tipo_pessoa" NOT NULL DEFAULT 'F',
    "email" VARCHAR,
    "telefone" TEXT,
    "endereco_id" UUID,
    "user_id" UUID,
    "tag_id" UUID,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."tag" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."pessoas_fisica" (
    "pessoa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "rg" TEXT,

    CONSTRAINT "pessoas_fisica_pkey" PRIMARY KEY ("pessoa_id")
);

-- CreateTable
CREATE TABLE "common"."pessoas_juridica" (
    "pessoa_id" UUID NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "cnpj" TEXT,
    "razao_social" TEXT,

    CONSTRAINT "pessoas_juridica_pkey" PRIMARY KEY ("pessoa_id")
);

-- CreateTable
CREATE TABLE "common"."empresas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pessoa_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."estados" (
    "uf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ibge" INTEGER,
    "id" SERIAL NOT NULL,
    "ddd" JSONB,

    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."municipios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ibge" INTEGER,
    "lat_lon" point,
    "estado_id" INTEGER NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."enderecos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cep" VARCHAR(8),
    "logradouro" VARCHAR,
    "numero" TEXT,
    "bairro" VARCHAR,
    "lat_lon" point,
    "estado_id" INTEGER,
    "municipio_id" INTEGER,
    "complemento" TEXT,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."tipos_licenca" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "tipos_licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."licencas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "empresa_id" UUID NOT NULL,
    "tipo_licenca_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "observacoes" TEXT,
    "data_emissao" TIMESTAMP(3) NOT NULL,
    "data_validade" TIMESTAMP(3) NOT NULL,
    "numero_licenca" TEXT NOT NULL,
    "orgao_emissor" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "licencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."vencimentos_condicionante" (
    "id" UUID NOT NULL,
    "licenca_condicionante_id" UUID NOT NULL,
    "mes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_cumprimento" TIMESTAMP(3),
    "observacao" TEXT,

    CONSTRAINT "vencimentos_condicionante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."condicionantes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "descricao" TEXT NOT NULL,
    "prazo_dias" INTEGER,
    "frequencia" "monitoramento"."frenquencia_condicionante",
    "tipo" "monitoramento"."tipo_condicionante" NOT NULL,

    CONSTRAINT "condicionantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."documentos_licenca" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vencimento_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER,

    CONSTRAINT "documentos_licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."licencas_condicionante" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "licenca_id" UUID NOT NULL,
    "condicionante_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "data_atribuicao" TIMESTAMP(3) NOT NULL,
    "dias_antecedencia" INTEGER,
    "meses" JSONB,
    "status" TEXT,
    "data_vencimento" TIMESTAMP(3),
    "observacao" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "licencas_condicionante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."notificacoes_condicionante" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "licenca_id" UUID NOT NULL,
    "condicionante_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "data_envio" TIMESTAMP(3) NOT NULL,
    "meio_envio" TEXT NOT NULL,
    "status_envio" TEXT NOT NULL,

    CONSTRAINT "notificacoes_condicionante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."estudos_ambiental" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "licenca_id" UUID NOT NULL,
    "tipo_estudo" TEXT NOT NULL,
    "data_entrega" TIMESTAMP(3) NOT NULL,
    "status_avaliacao" TEXT NOT NULL,

    CONSTRAINT "estudos_ambiental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."auditorias_notificacao" (
    "id" UUID NOT NULL,
    "notificacao_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "data_envio" TIMESTAMP(3) NOT NULL,
    "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."auditorias_licenca" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "licenca_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "data_alteracao" TIMESTAMP(3) NOT NULL,
    "campo_alterado" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,

    CONSTRAINT "auditorias_licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramento"."fiscalizacoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "licenca_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "data_visita" TIMESTAMP(3) NOT NULL,
    "relatorio" TEXT NOT NULL,
    "irregularidades" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "fiscalizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."ambiente" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "empresa_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambiente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."cargo_risco" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cargo_id" UUID NOT NULL,
    "risco_id" UUID NOT NULL,

    CONSTRAINT "cargo_risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."cargo_exame" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cargo_id" UUID NOT NULL,
    "exame_id" UUID NOT NULL,

    CONSTRAINT "cargo_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."cbo" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "codigo" UUID NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "cbo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."cargo" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "icone" TEXT,
    "atividades_executadas" TEXT,
    "recomendacoes_seguranca" TEXT,
    "cod_gfip_ltcat" TEXT,
    "metodologia_riscos" TEXT,
    "observacoes" TEXT,
    "parecer_ltcat" TEXT,
    "parecer_periculosidade" TEXT,
    "parecer_insalubridade" TEXT,
    "data_inicio_esocial" TIMESTAMP(3),
    "jornada_trabalho" TEXT,
    "ambiente_id" UUID NOT NULL,
    "cbo_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."cargo_ambiente" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "cargo_id" UUID NOT NULL,
    "ambiente_id" UUID NOT NULL,

    CONSTRAINT "cargo_ambiente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."epi" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "empresa_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."epc" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "empresa_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."risco_exame" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "risco_id" UUID NOT NULL,
    "exame_id" UUID NOT NULL,

    CONSTRAINT "risco_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."exame" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome_exame" TEXT NOT NULL,
    "cod_tabela_27" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "inserir_aso" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."risco_ocupacional" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tipo" TEXT NOT NULL,
    "agente" TEXT NOT NULL,
    "ambiente_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risco_ocupacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."exame_ocupacional" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "funcionario_id" UUID NOT NULL,
    "aso" TEXT NOT NULL,
    "riscos" TEXT NOT NULL,
    "empresa_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exame_ocupacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."categoria_exame" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nome" TEXT NOT NULL,

    CONSTRAINT "categoria_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."funcionario" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nis" INTEGER,
    "pessoa_id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."profissional" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "funcionario_id" UUID NOT NULL,
    "registro" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "conselho" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."ltcat" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "empresa_id" UUID NOT NULL,
    "ambiente_id" UUID NOT NULL,
    "profissional" TEXT NOT NULL,
    "registro_prof" TEXT NOT NULL,
    "numero_laudo" TEXT NOT NULL,
    "data_emissao" TIMESTAMP(3) NOT NULL,
    "data_validade" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ltcat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."ltcat_risco" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ltcat_id" UUID NOT NULL,
    "risco_id" UUID NOT NULL,

    CONSTRAINT "ltcat_risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguranca"."_CargoToRiscoOcupacional" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CargoToRiscoOcupacional_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "common"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "common"."invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_id_organization_id_key" ON "common"."members"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "common"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "common"."organizations"("domain");

-- CreateIndex
CREATE INDEX "permissions_roles_permission_id_idx" ON "common"."permissions_roles"("permission_id");

-- CreateIndex
CREATE INDEX "permissions_roles_role_id_idx" ON "common"."permissions_roles"("role_id");

-- CreateIndex
CREATE INDEX "members_permissions_member_id_idx" ON "common"."members_permissions"("member_id");

-- CreateIndex
CREATE INDEX "members_permissions_permission_id_idx" ON "common"."members_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "members_roles_role_id_idx" ON "common"."members_roles"("role_id");

-- CreateIndex
CREATE INDEX "members_roles_member_id_idx" ON "common"."members_roles"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "common"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_id_token_key" ON "common"."verification_tokens"("id", "token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "common"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "common"."sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "parceiros_organization_id_idx" ON "financeiro"."parceiros"("organization_id");

-- CreateIndex
CREATE INDEX "parceiros_tipo_idx" ON "financeiro"."parceiros"("tipo");

-- CreateIndex
CREATE INDEX "parceiros_ativo_idx" ON "financeiro"."parceiros"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "parceiros_organization_id_codigo_key" ON "financeiro"."parceiros"("organization_id", "codigo");

-- CreateIndex
CREATE INDEX "contas_bancarias_organization_id_idx" ON "financeiro"."contas_bancarias"("organization_id");

-- CreateIndex
CREATE INDEX "contas_bancarias_ativo_idx" ON "financeiro"."contas_bancarias"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "contas_bancarias_organization_id_codigo_key" ON "financeiro"."contas_bancarias"("organization_id", "codigo");

-- CreateIndex
CREATE INDEX "centros_custo_organization_id_idx" ON "financeiro"."centros_custo"("organization_id");

-- CreateIndex
CREATE INDEX "centros_custo_ativo_idx" ON "financeiro"."centros_custo"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_organization_id_codigo_key" ON "financeiro"."centros_custo"("organization_id", "codigo");

-- CreateIndex
CREATE INDEX "categorias_financeiras_organization_id_idx" ON "financeiro"."categorias_financeiras"("organization_id");

-- CreateIndex
CREATE INDEX "categorias_financeiras_tipo_idx" ON "financeiro"."categorias_financeiras"("tipo");

-- CreateIndex
CREATE INDEX "categorias_financeiras_ativo_idx" ON "financeiro"."categorias_financeiras"("ativo");

-- CreateIndex
CREATE INDEX "categorias_financeiras_parent_id_idx" ON "financeiro"."categorias_financeiras"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_financeiras_organization_id_codigo_key" ON "financeiro"."categorias_financeiras"("organization_id", "codigo");

-- CreateIndex
CREATE INDEX "plano_contas_organization_id_idx" ON "financeiro"."plano_contas"("organization_id");

-- CreateIndex
CREATE INDEX "plano_contas_tipo_idx" ON "financeiro"."plano_contas"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "plano_contas_organization_id_codigo_key" ON "financeiro"."plano_contas"("organization_id", "codigo");

-- CreateIndex
CREATE INDEX "lancamento_organization_id_idx" ON "financeiro"."lancamento"("organization_id");

-- CreateIndex
CREATE INDEX "lancamento_tipo_idx" ON "financeiro"."lancamento"("tipo");

-- CreateIndex
CREATE INDEX "lancamento_pago_idx" ON "financeiro"."lancamento"("pago");

-- CreateIndex
CREATE INDEX "lancamento_status_lancamento_idx" ON "financeiro"."lancamento"("status_lancamento");

-- CreateIndex
CREATE INDEX "lancamento_data_idx" ON "financeiro"."lancamento"("data");

-- CreateIndex
CREATE INDEX "lancamento_categoria_id_idx" ON "financeiro"."lancamento"("categoria_id");

-- CreateIndex
CREATE INDEX "lancamento_conta_bancaria_id_idx" ON "financeiro"."lancamento"("conta_bancaria_id");

-- CreateIndex
CREATE UNIQUE INDEX "lancamento_organization_id_numero_key" ON "financeiro"."lancamento"("organization_id", "numero");

-- CreateIndex
CREATE INDEX "parcelas_data_vencimento_idx" ON "financeiro"."parcelas"("data_vencimento");

-- CreateIndex
CREATE INDEX "parcelas_status_parcela_idx" ON "financeiro"."parcelas"("status_parcela");

-- CreateIndex
CREATE UNIQUE INDEX "parcelas_lancamento_id_numero_parcela_key" ON "financeiro"."parcelas"("lancamento_id", "numero_parcela");

-- CreateIndex
CREATE INDEX "documentos_financeiro_lancamento_id_idx" ON "financeiro"."documentos_financeiro"("lancamento_id");

-- CreateIndex
CREATE INDEX "documentos_financeiro_parceiro_id_idx" ON "financeiro"."documentos_financeiro"("parceiro_id");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_financeiro_tipo_numero_serie_key" ON "financeiro"."documentos_financeiro"("tipo", "numero", "serie");

-- CreateIndex
CREATE INDEX "extratos_conta_bancaria_id_idx" ON "financeiro"."extratos"("conta_bancaria_id");

-- CreateIndex
CREATE INDEX "extratos_dataExtrato_idx" ON "financeiro"."extratos"("dataExtrato");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_financeiras_organization_id_key" ON "financeiro"."configuracoes_financeiras"("organization_id");

-- CreateIndex
CREATE INDEX "relatorios_organization_id_idx" ON "financeiro"."relatorios"("organization_id");

-- CreateIndex
CREATE INDEX "relatorios_tipo_idx" ON "financeiro"."relatorios"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_fisica_cpf_key" ON "common"."pessoas_fisica"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_juridica_cnpj_key" ON "common"."pessoas_juridica"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_pessoa_id_key" ON "common"."empresas"("pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "licencas_numero_licenca_key" ON "monitoramento"."licencas"("numero_licenca");

-- CreateIndex
CREATE UNIQUE INDEX "licencas_condicionante_licenca_id_condicionante_id_key" ON "monitoramento"."licencas_condicionante"("licenca_id", "condicionante_id");

-- CreateIndex
CREATE INDEX "funcionario_organization_id_idx" ON "common"."funcionario"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "funcionario_empresa_id_pessoa_id_key" ON "common"."funcionario"("empresa_id", "pessoa_id");

-- CreateIndex
CREATE INDEX "_CargoToRiscoOcupacional_B_index" ON "seguranca"."_CargoToRiscoOcupacional"("B");

-- AddForeignKey
ALTER TABLE "common"."invites" ADD CONSTRAINT "invites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."invites" ADD CONSTRAINT "invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."members" ADD CONSTRAINT "members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."permissions_roles" ADD CONSTRAINT "permissions_roles_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "common"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."permissions_roles" ADD CONSTRAINT "permissions_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "common"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."members_permissions" ADD CONSTRAINT "members_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "common"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."members_permissions" ADD CONSTRAINT "members_permissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "common"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."members_roles" ADD CONSTRAINT "members_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "common"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."members_roles" ADD CONSTRAINT "members_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "common"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."parceiros" ADD CONSTRAINT "parceiros_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."contas_bancarias" ADD CONSTRAINT "contas_bancarias_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."centros_custo" ADD CONSTRAINT "centros_custo_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "financeiro"."categorias_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."plano_contas" ADD CONSTRAINT "plano_contas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."plano_contas" ADD CONSTRAINT "plano_contas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "financeiro"."plano_contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "financeiro"."categorias_financeiras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "financeiro"."contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "financeiro"."centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "financeiro"."parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamento" ADD CONSTRAINT "lancamento_lancamento_transferencia_id_fkey" FOREIGN KEY ("lancamento_transferencia_id") REFERENCES "financeiro"."lancamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."parcelas" ADD CONSTRAINT "parcelas_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."parcelas" ADD CONSTRAINT "parcelas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."documentos_financeiro" ADD CONSTRAINT "documentos_financeiro_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."documentos_financeiro" ADD CONSTRAINT "documentos_financeiro_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "financeiro"."parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."documentos_financeiro" ADD CONSTRAINT "documentos_financeiro_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."extratos" ADD CONSTRAINT "extratos_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "financeiro"."contas_bancarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."extratos" ADD CONSTRAINT "extratos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."configuracoes_financeiras" ADD CONSTRAINT "configuracoes_financeiras_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."relatorios" ADD CONSTRAINT "relatorios_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."pessoas" ADD CONSTRAINT "pessoas_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "common"."enderecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."pessoas" ADD CONSTRAINT "pessoas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."pessoas" ADD CONSTRAINT "pessoas_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "common"."tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."pessoas_fisica" ADD CONSTRAINT "pessoas_fisica_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "common"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."pessoas_juridica" ADD CONSTRAINT "pessoas_juridica_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "common"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."empresas" ADD CONSTRAINT "empresas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."empresas" ADD CONSTRAINT "empresas_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "common"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."municipios" ADD CONSTRAINT "municipios_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "common"."estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."enderecos" ADD CONSTRAINT "enderecos_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "common"."estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."enderecos" ADD CONSTRAINT "enderecos_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "common"."municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."licencas" ADD CONSTRAINT "licencas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."licencas" ADD CONSTRAINT "licencas_tipo_licenca_id_fkey" FOREIGN KEY ("tipo_licenca_id") REFERENCES "monitoramento"."tipos_licenca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."vencimentos_condicionante" ADD CONSTRAINT "vencimentos_condicionante_licenca_condicionante_id_fkey" FOREIGN KEY ("licenca_condicionante_id") REFERENCES "monitoramento"."licencas_condicionante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."documentos_licenca" ADD CONSTRAINT "documentos_licenca_vencimento_id_fkey" FOREIGN KEY ("vencimento_id") REFERENCES "monitoramento"."vencimentos_condicionante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."licencas_condicionante" ADD CONSTRAINT "licencas_condicionante_condicionante_id_fkey" FOREIGN KEY ("condicionante_id") REFERENCES "monitoramento"."condicionantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."licencas_condicionante" ADD CONSTRAINT "licencas_condicionante_licenca_id_fkey" FOREIGN KEY ("licenca_id") REFERENCES "monitoramento"."licencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."licencas_condicionante" ADD CONSTRAINT "licencas_condicionante_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."notificacoes_condicionante" ADD CONSTRAINT "notificacoes_condicionante_condicionante_id_fkey" FOREIGN KEY ("condicionante_id") REFERENCES "monitoramento"."condicionantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."notificacoes_condicionante" ADD CONSTRAINT "notificacoes_condicionante_licenca_id_fkey" FOREIGN KEY ("licenca_id") REFERENCES "monitoramento"."licencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."notificacoes_condicionante" ADD CONSTRAINT "notificacoes_condicionante_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."estudos_ambiental" ADD CONSTRAINT "estudos_ambiental_licenca_id_fkey" FOREIGN KEY ("licenca_id") REFERENCES "monitoramento"."licencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."auditorias_notificacao" ADD CONSTRAINT "auditorias_notificacao_notificacao_id_fkey" FOREIGN KEY ("notificacao_id") REFERENCES "monitoramento"."notificacoes_condicionante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."auditorias_notificacao" ADD CONSTRAINT "auditorias_notificacao_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."auditorias_licenca" ADD CONSTRAINT "auditorias_licenca_licenca_id_fkey" FOREIGN KEY ("licenca_id") REFERENCES "monitoramento"."licencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."auditorias_licenca" ADD CONSTRAINT "auditorias_licenca_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."fiscalizacoes" ADD CONSTRAINT "fiscalizacoes_licenca_id_fkey" FOREIGN KEY ("licenca_id") REFERENCES "monitoramento"."licencas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramento"."fiscalizacoes" ADD CONSTRAINT "fiscalizacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "common"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."ambiente" ADD CONSTRAINT "ambiente_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo_risco" ADD CONSTRAINT "cargo_risco_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "seguranca"."cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo_risco" ADD CONSTRAINT "cargo_risco_risco_id_fkey" FOREIGN KEY ("risco_id") REFERENCES "seguranca"."risco_ocupacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo_exame" ADD CONSTRAINT "cargo_exame_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "seguranca"."cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo_exame" ADD CONSTRAINT "cargo_exame_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "seguranca"."exame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo" ADD CONSTRAINT "cargo_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "seguranca"."ambiente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo" ADD CONSTRAINT "cargo_cbo_id_fkey" FOREIGN KEY ("cbo_id") REFERENCES "seguranca"."cbo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo_ambiente" ADD CONSTRAINT "cargo_ambiente_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "seguranca"."cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."cargo_ambiente" ADD CONSTRAINT "cargo_ambiente_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "seguranca"."ambiente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."epi" ADD CONSTRAINT "epi_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."epc" ADD CONSTRAINT "epc_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."risco_exame" ADD CONSTRAINT "risco_exame_risco_id_fkey" FOREIGN KEY ("risco_id") REFERENCES "seguranca"."risco_ocupacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."risco_exame" ADD CONSTRAINT "risco_exame_exame_id_fkey" FOREIGN KEY ("exame_id") REFERENCES "seguranca"."exame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."risco_ocupacional" ADD CONSTRAINT "risco_ocupacional_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "seguranca"."ambiente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."exame_ocupacional" ADD CONSTRAINT "exame_ocupacional_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."exame_ocupacional" ADD CONSTRAINT "exame_ocupacional_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "common"."funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."funcionario" ADD CONSTRAINT "funcionario_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "common"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."funcionario" ADD CONSTRAINT "funcionario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."funcionario" ADD CONSTRAINT "funcionario_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."profissional" ADD CONSTRAINT "profissional_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "common"."funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."ltcat" ADD CONSTRAINT "ltcat_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "common"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."ltcat" ADD CONSTRAINT "ltcat_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "seguranca"."ambiente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."ltcat_risco" ADD CONSTRAINT "ltcat_risco_ltcat_id_fkey" FOREIGN KEY ("ltcat_id") REFERENCES "seguranca"."ltcat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."ltcat_risco" ADD CONSTRAINT "ltcat_risco_risco_id_fkey" FOREIGN KEY ("risco_id") REFERENCES "seguranca"."risco_ocupacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."_CargoToRiscoOcupacional" ADD CONSTRAINT "_CargoToRiscoOcupacional_A_fkey" FOREIGN KEY ("A") REFERENCES "seguranca"."cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguranca"."_CargoToRiscoOcupacional" ADD CONSTRAINT "_CargoToRiscoOcupacional_B_fkey" FOREIGN KEY ("B") REFERENCES "seguranca"."risco_ocupacional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
