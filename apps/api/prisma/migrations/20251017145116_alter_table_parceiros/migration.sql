/*
  Warnings:

  - You are about to drop the column `bairro` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `celular` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `cep` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `cidade` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `complemento` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `contato` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `cpfCnpj` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `endereco` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `inscricaoEstadual` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `telefone` on the `parceiros` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `parceiros` table. All the data in the column will be lost.
  - Added the required column `pessoa_id` to the `parceiros` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "financeiro"."parceiros_tipo_idx";

-- AlterTable
ALTER TABLE "financeiro"."parceiros" DROP COLUMN "bairro",
DROP COLUMN "celular",
DROP COLUMN "cep",
DROP COLUMN "cidade",
DROP COLUMN "complemento",
DROP COLUMN "contato",
DROP COLUMN "cpfCnpj",
DROP COLUMN "email",
DROP COLUMN "endereco",
DROP COLUMN "estado",
DROP COLUMN "inscricaoEstadual",
DROP COLUMN "nome",
DROP COLUMN "numero",
DROP COLUMN "telefone",
DROP COLUMN "tipo",
ADD COLUMN     "pessoa_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "financeiro"."parceiros" ADD CONSTRAINT "parceiros_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "common"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
