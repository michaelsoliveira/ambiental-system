-- AlterTable
ALTER TABLE "financeiro"."rubricas_folha" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "common"."landing_sites" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "organization_id" UUID NOT NULL,
    "draft_content" JSONB NOT NULL,
    "published_content" JSONB,
    "published_at" TIMESTAMP(6),
    "updated_by_user_id" UUID,

    CONSTRAINT "landing_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_sites_organization_id_key" ON "common"."landing_sites"("organization_id");

-- AddForeignKey
ALTER TABLE "common"."landing_sites" ADD CONSTRAINT "landing_sites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
