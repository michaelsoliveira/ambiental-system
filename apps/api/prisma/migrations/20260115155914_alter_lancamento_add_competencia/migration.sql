-- CreateEnum
CREATE TYPE "financeiro"."TipoConta" AS ENUM ('BANCARIA', 'CONTABIL');

-- CreateEnum
CREATE TYPE "financeiro"."TipoRepeticao" AS ENUM ('NENHUMA', 'RECORRENTE', 'PARCELADO');

-- CreateEnum
CREATE TYPE "financeiro"."Periodicidade" AS ENUM ('DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- AlterTable
ALTER TABLE "financeiro"."contas_bancarias" ADD COLUMN     "conta_pai_id" UUID,
ADD COLUMN     "tipo_conta" "financeiro"."TipoConta" NOT NULL DEFAULT 'BANCARIA',
ALTER COLUMN "banco" DROP NOT NULL,
ALTER COLUMN "tipoConta" DROP NOT NULL;

-- AlterTable
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN     "data_competencia" VARCHAR(7),
ADD COLUMN     "data_fim_repeticao" TIMESTAMP(3),
ADD COLUMN     "lancamento_origem_id" UUID,
ADD COLUMN     "lancamento_recorrente_id" UUID,
ADD COLUMN     "parcela_atual" INTEGER,
ADD COLUMN     "periodicidade" "financeiro"."Periodicidade",
ADD COLUMN     "tipo_repeticao" "financeiro"."TipoRepeticao" NOT NULL DEFAULT 'NENHUMA';

-- CreateTable
CREATE TABLE "financeiro"."lancamentos_recorrentes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "tipo" "financeiro"."TipoLancamento" NOT NULL,
    "descricao" VARCHAR(500) NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "periodicidade" "financeiro"."Periodicidade" NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3),
    "dia_vencimento" INTEGER,
    "categoria_id" UUID NOT NULL,
    "conta_bancaria_id" UUID NOT NULL,
    "centro_custo_id" UUID,
    "parceiro_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lancamentos_recorrentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_recorrentes_organization_id_idx" ON "financeiro"."lancamentos_recorrentes"("organization_id");

-- CreateIndex
CREATE INDEX "lancamentos_recorrentes_ativo_idx" ON "financeiro"."lancamentos_recorrentes"("ativo");

-- CreateIndex
CREATE INDEX "lancamentos_recorrentes_data_inicio_idx" ON "financeiro"."lancamentos_recorrentes"("data_inicio");

-- CreateIndex
CREATE INDEX "contas_bancarias_tipo_conta_idx" ON "financeiro"."contas_bancarias"("tipo_conta");

-- CreateIndex
CREATE INDEX "contas_bancarias_conta_pai_id_idx" ON "financeiro"."contas_bancarias"("conta_pai_id");

-- CreateIndex
CREATE INDEX "lancamentos_tipo_repeticao_idx" ON "financeiro"."lancamentos"("tipo_repeticao");

-- CreateIndex
CREATE INDEX "lancamentos_lancamento_origem_id_idx" ON "financeiro"."lancamentos"("lancamento_origem_id");

-- CreateIndex
CREATE INDEX "lancamentos_lancamento_recorrente_id_idx" ON "financeiro"."lancamentos"("lancamento_recorrente_id");

-- AddForeignKey
ALTER TABLE "financeiro"."contas_bancarias" ADD CONSTRAINT "contas_bancarias_conta_pai_id_fkey" FOREIGN KEY ("conta_pai_id") REFERENCES "financeiro"."contas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_lancamento_origem_id_fkey" FOREIGN KEY ("lancamento_origem_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos" ADD CONSTRAINT "lancamentos_lancamento_recorrente_id_fkey" FOREIGN KEY ("lancamento_recorrente_id") REFERENCES "financeiro"."lancamentos_recorrentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD CONSTRAINT "lancamentos_recorrentes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD CONSTRAINT "lancamentos_recorrentes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "financeiro"."categoria_financeira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD CONSTRAINT "lancamentos_recorrentes_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "financeiro"."contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD CONSTRAINT "lancamentos_recorrentes_centro_custo_id_fkey" FOREIGN KEY ("centro_custo_id") REFERENCES "financeiro"."centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD CONSTRAINT "lancamentos_recorrentes_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "financeiro"."parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
