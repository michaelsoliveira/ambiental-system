CREATE TYPE "financeiro"."CategoriaPatrimonio" AS ENUM (
  'IMOVEL',
  'VEICULO',
  'MAQUINA_EQUIPAMENTO',
  'MOVEL_UTENSILIO',
  'INFORMATICA',
  'INVESTIMENTO',
  'ESTOQUE',
  'OUTRO'
);

CREATE TYPE "financeiro"."MetodoDepreciacaoPatrimonio" AS ENUM (
  'LINEAR',
  'ACELERADA',
  'MANUAL',
  'NAO_DEPRECIA'
);

CREATE TYPE "financeiro"."StatusPatrimonioAtivo" AS ENUM (
  'ATIVO',
  'BAIXADO',
  'VENDIDO',
  'MANUTENCAO',
  'INATIVO'
);

CREATE TYPE "financeiro"."TipoPatrimonioPassivo" AS ENUM (
  'EMPRESTIMO',
  'FINANCIAMENTO',
  'PARCELAMENTO',
  'FORNECEDOR',
  'TRIBUTO',
  'TRABALHISTA',
  'OUTRO'
);

CREATE TYPE "financeiro"."StatusPatrimonioPassivo" AS ENUM (
  'ABERTO',
  'QUITADO',
  'CANCELADO',
  'ATRASADO'
);

CREATE TABLE "financeiro"."patrimonio_ativos" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  "nome" VARCHAR(255) NOT NULL,
  "descricao" TEXT,
  "categoria" "financeiro"."CategoriaPatrimonio" NOT NULL,
  "tipo" VARCHAR(100),
  "codigo" VARCHAR(100),
  "data_aquisicao" TIMESTAMP(3),
  "valor_aquisicao" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "valor_atual" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "metodo_depreciacao" "financeiro"."MetodoDepreciacaoPatrimonio",
  "taxa_depreciacao_anual" DECIMAL(5,2),
  "vida_util_meses" INTEGER,
  "status" "financeiro"."StatusPatrimonioAtivo" NOT NULL DEFAULT 'ATIVO',
  "localizacao" VARCHAR(255),
  "responsavel" VARCHAR(255),
  "observacoes" TEXT,
  "veiculo_id" UUID,
  "conta_bancaria_id" UUID,
  "lancamento_id" UUID,
  CONSTRAINT "patrimonio_ativos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financeiro"."patrimonio_avaliacoes" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "patrimonio_ativo_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  "data_avaliacao" TIMESTAMP(6) NOT NULL,
  "valor" DECIMAL(15,2) NOT NULL,
  "avaliador" VARCHAR(255),
  "metodo" VARCHAR(100),
  "observacoes" TEXT,
  CONSTRAINT "patrimonio_avaliacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financeiro"."patrimonio_documentos" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "patrimonio_ativo_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  "tipo" VARCHAR(100) NOT NULL,
  "nome" VARCHAR(255) NOT NULL,
  "url" TEXT,
  "path" TEXT,
  "observacoes" TEXT,
  CONSTRAINT "patrimonio_documentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financeiro"."patrimonio_passivos" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  "descricao" VARCHAR(500) NOT NULL,
  "tipo" "financeiro"."TipoPatrimonioPassivo" NOT NULL,
  "credor" VARCHAR(255),
  "valor_original" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "saldo_devedor" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "data_inicio" TIMESTAMP(3),
  "data_vencimento" TIMESTAMP(3),
  "taxa_juros" DECIMAL(5,2),
  "status" "financeiro"."StatusPatrimonioPassivo" NOT NULL DEFAULT 'ABERTO',
  "observacoes" TEXT,
  CONSTRAINT "patrimonio_passivos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patrimonio_ativos_organization_id_codigo_key" ON "financeiro"."patrimonio_ativos"("organization_id", "codigo");
CREATE INDEX "patrimonio_ativos_organization_id_idx" ON "financeiro"."patrimonio_ativos"("organization_id");
CREATE INDEX "patrimonio_ativos_categoria_idx" ON "financeiro"."patrimonio_ativos"("categoria");
CREATE INDEX "patrimonio_ativos_status_idx" ON "financeiro"."patrimonio_ativos"("status");
CREATE INDEX "patrimonio_ativos_veiculo_id_idx" ON "financeiro"."patrimonio_ativos"("veiculo_id");
CREATE INDEX "patrimonio_ativos_conta_bancaria_id_idx" ON "financeiro"."patrimonio_ativos"("conta_bancaria_id");
CREATE INDEX "patrimonio_ativos_lancamento_id_idx" ON "financeiro"."patrimonio_ativos"("lancamento_id");

CREATE INDEX "patrimonio_avaliacoes_organization_id_idx" ON "financeiro"."patrimonio_avaliacoes"("organization_id");
CREATE INDEX "patrimonio_avaliacoes_patrimonio_ativo_id_idx" ON "financeiro"."patrimonio_avaliacoes"("patrimonio_ativo_id");
CREATE INDEX "patrimonio_avaliacoes_data_avaliacao_idx" ON "financeiro"."patrimonio_avaliacoes"("data_avaliacao");

CREATE INDEX "patrimonio_documentos_organization_id_idx" ON "financeiro"."patrimonio_documentos"("organization_id");
CREATE INDEX "patrimonio_documentos_patrimonio_ativo_id_idx" ON "financeiro"."patrimonio_documentos"("patrimonio_ativo_id");

CREATE INDEX "patrimonio_passivos_organization_id_idx" ON "financeiro"."patrimonio_passivos"("organization_id");
CREATE INDEX "patrimonio_passivos_tipo_idx" ON "financeiro"."patrimonio_passivos"("tipo");
CREATE INDEX "patrimonio_passivos_status_idx" ON "financeiro"."patrimonio_passivos"("status");
CREATE INDEX "patrimonio_passivos_data_vencimento_idx" ON "financeiro"."patrimonio_passivos"("data_vencimento");

ALTER TABLE "financeiro"."patrimonio_ativos"
  ADD CONSTRAINT "patrimonio_ativos_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_ativos"
  ADD CONSTRAINT "patrimonio_ativos_veiculo_id_fkey"
  FOREIGN KEY ("veiculo_id") REFERENCES "frota"."veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_ativos"
  ADD CONSTRAINT "patrimonio_ativos_conta_bancaria_id_fkey"
  FOREIGN KEY ("conta_bancaria_id") REFERENCES "financeiro"."contas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_ativos"
  ADD CONSTRAINT "patrimonio_ativos_lancamento_id_fkey"
  FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_avaliacoes"
  ADD CONSTRAINT "patrimonio_avaliacoes_patrimonio_ativo_id_fkey"
  FOREIGN KEY ("patrimonio_ativo_id") REFERENCES "financeiro"."patrimonio_ativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_avaliacoes"
  ADD CONSTRAINT "patrimonio_avaliacoes_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_documentos"
  ADD CONSTRAINT "patrimonio_documentos_patrimonio_ativo_id_fkey"
  FOREIGN KEY ("patrimonio_ativo_id") REFERENCES "financeiro"."patrimonio_ativos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_documentos"
  ADD CONSTRAINT "patrimonio_documentos_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "financeiro"."patrimonio_passivos"
  ADD CONSTRAINT "patrimonio_passivos_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
