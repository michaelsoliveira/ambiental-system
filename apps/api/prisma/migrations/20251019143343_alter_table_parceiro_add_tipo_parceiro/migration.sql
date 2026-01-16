/*
  Warnings:

  - You are about to drop the column `codigo` on the `parceiros` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organization_id,pessoa_id]` on the table `parceiros` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tipo_parceiro` to the `parceiros` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "financeiro"."parceiros_organization_id_codigo_key";

-- AlterTable
ALTER TABLE "financeiro"."parceiros" DROP COLUMN "codigo",
ADD COLUMN     "tipo_parceiro" "financeiro"."TipoParceiro" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "parceiros_organization_id_pessoa_id_key" ON "financeiro"."parceiros"("organization_id", "pessoa_id");
