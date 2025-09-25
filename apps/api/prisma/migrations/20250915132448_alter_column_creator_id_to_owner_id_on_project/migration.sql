/*
  Warnings:

  - You are about to drop the column `creator_id` on the `projects` table. All the data in the column will be lost.
  - Made the column `owner_id` on table `organizations` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `owner_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_creator_id_fkey";

-- AlterTable
ALTER TABLE "public"."organizations" ALTER COLUMN "owner_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "creator_id",
ADD COLUMN     "owner_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
