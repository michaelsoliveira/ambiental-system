/*
  Warnings:

  - You are about to drop the `categorias_financeiras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `configuracoes_financeiras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lancamento` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "financeiro"."categorias_financeiras" DROP CONSTRAINT "categorias_financeiras_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."categorias_financeiras" DROP CONSTRAINT "categorias_financeiras_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."configuracoes_financeiras" DROP CONSTRAINT "configuracoes_financeiras_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."documentos_financeiro" DROP CONSTRAINT "documentos_financeiro_lancamento_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."lancamento" DROP CONSTRAINT "lancamento_categoria_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."lancamento" DROP CONSTRAINT "lancamento_centro_custo_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."lancamento" DROP CONSTRAINT "lancamento_conta_bancaria_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."lancamento" DROP CONSTRAINT "lancamento_lancamento_transferencia_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."lancamento" DROP CONSTRAINT "lancamento_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."lancamento" DROP CONSTRAINT "lancamento_parceiro_id_fkey";

-- DropForeignKey
ALTER TABLE "financeiro"."parcelas" DROP CONSTRAINT "parcelas_lancamento_id_fkey";

-- DropTable
DROP TABLE "financeiro"."categorias_financeiras";

-- DropTable
DROP TABLE "financeiro"."configuracoes_financeiras";

-- DropTable
DROP TABLE "financeiro"."lancamento";

-- CreateTable
CREATE TABLE "financeiro"."categoria_financeira" (
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

    CONSTRAINT "categoria_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."lancamentos" (
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

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiro"."configuracao_financeira" (
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

    CONSTRAINT "configuracao_financeira_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categoria_financeira_organization_id_idx" ON "financeiro"."categoria_financeira"("organization_id");

-- CreateIndex
CREATE INDEX "categoria_financeira_tipo_idx" ON "financeiro"."categoria_financeira"("tipo");

-- CreateIndex
CREATE INDEX "categoria_financeira_ativo_idx" ON "financeiro"."categoria_financeira"("ativo");

-- CreateIndex
CREATE INDEX "categoria_financeira_parent_id_idx" ON "financeiro"."categoria_financeira"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_financeira_organization_id_codigo_key" ON "financeiro"."categoria_financeira"("organization_id", "codigo");

-- CreateIndex
CREATE INDEX "lancamentos_organization_id_idx" ON "financeiro"."lancamentos"("organization_id");

-- CreateIndex
CREATE INDEX "lancamentos_tipo_idx" ON "financeiro"."lancamentos"("tipo");

-- CreateIndex
CREATE INDEX "lancamentos_pago_idx" ON "financeiro"."lancamentos"("pago");

-- CreateIndex
CREATE INDEX "lancamentos_status_lancamento_idx" ON "financeiro"."lancamentos"("status_lancamento");

-- CreateIndex
CREATE INDEX "lancamentos_data_idx" ON "financeiro"."lancamentos"("data");

-- CreateIndex
CREATE INDEX "lancamentos_categoria_id_idx" ON "financeiro"."lancamentos"("categoria_id");

-- CreateIndex
CREATE INDEX "lancamentos_conta_bancaria_id_idx" ON "financeiro"."lancamentos"("conta_bancaria_id");

-- CreateIndex
CREATE UNIQUE INDEX "lancamentos_organization_id_numero_key" ON "financeiro"."lancamentos"("organization_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "configuracao_financeira_organization_id_key" ON "financeiro"."configuracao_financeira"("organization_id");

-- AddForeignKey
ALTER TABLE "financeiro"."categoria_financeira" ADD CONSTRAINT "categoria_financeira_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."categoria_financeira" ADD CONSTRAINT "categoria_financeira_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "financeiro"."categoria_financeira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "financeiro"."categoria_financeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "financeiro"."contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "financeiro"."centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "financeiro"."parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_lancamento_transferencia_id_fkey" FOREIGN KEY ("lancamento_transferencia_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."parcelas" ADD CONSTRAINT "parcelas_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."documentos_financeiro" ADD CONSTRAINT "documentos_financeiro_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."configuracao_financeira" ADD CONSTRAINT "configuracao_financeira_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
