-- Domínio operacional de frota + vínculo opcional em lançamentos financeiros.
CREATE SCHEMA IF NOT EXISTS "frota";

-- Veículos
CREATE TABLE "frota"."veiculos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "placa" VARCHAR(10) NOT NULL,
    "modelo" VARCHAR(255) NOT NULL,
    "marca" VARCHAR(255) NOT NULL,
    "ano" INTEGER,
    "tipo" VARCHAR(50),
    "km_atual" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "veiculos_organization_id_placa_key" ON "frota"."veiculos"("organization_id", "placa");
CREATE INDEX "veiculos_organization_id_idx" ON "frota"."veiculos"("organization_id");
CREATE INDEX "veiculos_ativo_idx" ON "frota"."veiculos"("ativo");

ALTER TABLE "frota"."veiculos" ADD CONSTRAINT "veiculos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Opcional no lançamento financeiro
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "veiculo_id" UUID;

CREATE INDEX "lancamentos_veiculo_id_idx" ON "financeiro"."lancamentos"("veiculo_id");

ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "frota"."veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Abastecimento
CREATE TABLE "frota"."abastecimentos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "veiculo_id" UUID NOT NULL,
    "data" TIMESTAMP(6) NOT NULL,
    "litros" DOUBLE PRECISION NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "km" DOUBLE PRECISION,
    "lancamento_id" UUID,
    CONSTRAINT "abastecimentos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "abastecimentos_lancamento_id_key" ON "frota"."abastecimentos"("lancamento_id");
CREATE INDEX "abastecimentos_veiculo_id_idx" ON "frota"."abastecimentos"("veiculo_id");
CREATE INDEX "abastecimentos_data_idx" ON "frota"."abastecimentos"("data");

ALTER TABLE "frota"."abastecimentos" ADD CONSTRAINT "abastecimentos_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "frota"."veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "frota"."abastecimentos" ADD CONSTRAINT "abastecimentos_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Manutenção
CREATE TABLE "frota"."manutencoes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "veiculo_id" UUID NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(6) NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "lancamento_id" UUID,
    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "manutencoes_lancamento_id_key" ON "frota"."manutencoes"("lancamento_id");
CREATE INDEX "manutencoes_veiculo_id_idx" ON "frota"."manutencoes"("veiculo_id");
CREATE INDEX "manutencoes_data_idx" ON "frota"."manutencoes"("data");

ALTER TABLE "frota"."manutencoes" ADD CONSTRAINT "manutencoes_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "frota"."veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "frota"."manutencoes" ADD CONSTRAINT "manutencoes_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Viagem (receita operacional)
CREATE TABLE "frota"."viagens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "veiculo_id" UUID NOT NULL,
    "origem" VARCHAR(500) NOT NULL,
    "destino" VARCHAR(500) NOT NULL,
    "data_inicio" TIMESTAMP(6) NOT NULL,
    "data_fim" TIMESTAMP(6),
    "km_rodado" DOUBLE PRECISION,
    "valor" DECIMAL(15,2),
    "lancamento_id" UUID,
    CONSTRAINT "viagens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "viagens_lancamento_id_key" ON "frota"."viagens"("lancamento_id");
CREATE INDEX "viagens_veiculo_id_idx" ON "frota"."viagens"("veiculo_id");
CREATE INDEX "viagens_data_inicio_idx" ON "frota"."viagens"("data_inicio");

ALTER TABLE "frota"."viagens" ADD CONSTRAINT "viagens_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "frota"."veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "frota"."viagens" ADD CONSTRAINT "viagens_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
