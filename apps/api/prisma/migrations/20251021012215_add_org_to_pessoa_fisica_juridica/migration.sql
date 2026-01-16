/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,cpf]` on the table `pessoas_fisica` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,cnpj]` on the table `pessoas_juridica` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organization_id` to the `pessoas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `pessoas_fisica` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `pessoas_juridica` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "common"."pessoas" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "organization_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "common"."pessoas_fisica" ADD COLUMN     "organization_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "common"."pessoas_juridica" ADD COLUMN     "organization_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "pessoas_organization_id_deleted_at_idx" ON "common"."pessoas"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_fisica_organization_id_cpf_key" ON "common"."pessoas_fisica"("organization_id", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_juridica_organization_id_cnpj_key" ON "common"."pessoas_juridica"("organization_id", "cnpj");

-- AddForeignKey
ALTER TABLE "common"."pessoas" ADD CONSTRAINT "pessoas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
