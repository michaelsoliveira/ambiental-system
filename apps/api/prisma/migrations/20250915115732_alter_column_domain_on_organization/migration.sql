/*
  Warnings:

  - You are about to drop the column `domain` on the `organizations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[domain]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."organizations_domain_key";

-- AlterTable
ALTER TABLE "public"."organizations" DROP COLUMN "domain",
ADD COLUMN     "domain" VARCHAR;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "public"."organizations"("domain");
