/*
  Warnings:

  - You are about to drop the `users_roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."users_roles" DROP CONSTRAINT "users_roles_member_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users_roles" DROP CONSTRAINT "users_roles_role_id_fkey";

-- DropTable
DROP TABLE "public"."users_roles";

-- CreateTable
CREATE TABLE "public"."members_roles" (
    "member_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "members_roles_pkey" PRIMARY KEY ("member_id","role_id")
);

-- CreateIndex
CREATE INDEX "members_roles_role_id_idx" ON "public"."members_roles"("role_id");

-- CreateIndex
CREATE INDEX "members_roles_member_id_idx" ON "public"."members_roles"("member_id");

-- AddForeignKey
ALTER TABLE "public"."members_roles" ADD CONSTRAINT "members_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."members_roles" ADD CONSTRAINT "members_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
