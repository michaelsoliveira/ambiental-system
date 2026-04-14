/*
  Warnings:

  - The `tipo_contrato` column on the `funcionario` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "common"."TipoContratoFuncionario" AS ENUM ('CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO', 'APRENDIZ');

-- AlterTable
ALTER TABLE "common"."cargo_funcionario" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "common"."funcionario" DROP COLUMN "tipo_contrato",
ADD COLUMN     "tipo_contrato" "common"."TipoContratoFuncionario" NOT NULL DEFAULT 'CLT';

-- AlterTable
ALTER TABLE "financeiro"."folhas_pagamento" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "financeiro"."folhas_pagamento_itens" ALTER COLUMN "updated_at" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "financeiro"."folhas_pagamento_organization_id_referencia_ano_referencia_mes_" RENAME TO "folhas_pagamento_organization_id_referencia_ano_referencia__idx";
