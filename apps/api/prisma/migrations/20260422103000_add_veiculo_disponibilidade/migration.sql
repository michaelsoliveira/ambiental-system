-- CreateTable
CREATE TABLE "frota"."veiculos_disponibilidade" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "veiculo_id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "inicio" TIMESTAMP(6) NOT NULL,
    "fim" TIMESTAMP(6) NOT NULL,
    "motivo" VARCHAR(500),
    "origem" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "veiculos_disponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "veiculos_disponibilidade_organization_id_inicio_fim_idx"
ON "frota"."veiculos_disponibilidade"("organization_id", "inicio", "fim");

-- CreateIndex
CREATE INDEX "veiculos_disponibilidade_veiculo_id_inicio_fim_idx"
ON "frota"."veiculos_disponibilidade"("veiculo_id", "inicio", "fim");

-- AddForeignKey
ALTER TABLE "frota"."veiculos_disponibilidade"
ADD CONSTRAINT "veiculos_disponibilidade_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frota"."veiculos_disponibilidade"
ADD CONSTRAINT "veiculos_disponibilidade_veiculo_id_fkey"
FOREIGN KEY ("veiculo_id") REFERENCES "frota"."veiculos"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
