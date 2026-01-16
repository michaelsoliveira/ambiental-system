/*
  Warnings:

  - You are about to alter the column `logradouro` on the `enderecos` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(255)`.
  - You are about to alter the column `numero` on the `enderecos` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `bairro` on the `enderecos` table. The data in that column could be lost. The data in that column will be cast from `VarChar` to `VarChar(100)`.
  - You are about to alter the column `complemento` on the `enderecos` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "common"."enderecos" ALTER COLUMN "cep" SET DATA TYPE VARCHAR(9),
ALTER COLUMN "logradouro" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "numero" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "bairro" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "complemento" SET DATA TYPE VARCHAR(255);
