CREATE TABLE "common"."cargo_funcionario" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "codigo" VARCHAR(50),
  "nome" VARCHAR(120) NOT NULL,
  "descricao" TEXT,
  "salario_base" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "ativo" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "cargo_funcionario_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cargo_funcionario_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "cargo_funcionario_organization_id_nome_key"
  ON "common"."cargo_funcionario"("organization_id","nome");
CREATE UNIQUE INDEX "cargo_funcionario_organization_id_codigo_key"
  ON "common"."cargo_funcionario"("organization_id","codigo");
CREATE INDEX "cargo_funcionario_organization_id_ativo_idx"
  ON "common"."cargo_funcionario"("organization_id","ativo");

ALTER TABLE "common"."funcionario"
  ADD COLUMN "cargo_id" UUID;

-- Migração de dados legados: cria cargo por nome/salário e vincula funcionário
INSERT INTO "common"."cargo_funcionario" ("organization_id","nome","salario_base","created_at","updated_at")
SELECT DISTINCT
  f."organization_id",
  COALESCE(NULLIF(TRIM(f."cargo"), ''), 'Cargo padrão') AS nome,
  COALESCE(f."salario_base", 0),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "common"."funcionario" f
WHERE f."cargo" IS NOT NULL;

UPDATE "common"."funcionario" f
SET "cargo_id" = c."id"
FROM "common"."cargo_funcionario" c
WHERE c."organization_id" = f."organization_id"
  AND c."nome" = COALESCE(NULLIF(TRIM(f."cargo"), ''), 'Cargo padrão');

CREATE INDEX "funcionario_cargo_id_idx" ON "common"."funcionario"("cargo_id");

ALTER TABLE "common"."funcionario"
  ADD CONSTRAINT "funcionario_cargo_id_fkey"
  FOREIGN KEY ("cargo_id") REFERENCES "common"."cargo_funcionario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "common"."funcionario"
  DROP COLUMN "cargo",
  DROP COLUMN "salario_base";
