/*
  Warnings:

  - Added the required column `created_by_user_id` to the `pessoas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "common"."pessoas" ADD COLUMN     "created_by_user_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "common"."pessoas" ADD CONSTRAINT "pessoas_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "common"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
