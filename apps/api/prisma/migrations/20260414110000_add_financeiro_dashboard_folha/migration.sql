-- Expandir cadastro de funcionários para folha avançada
ALTER TABLE "common"."funcionario"
  ADD COLUMN "matricula" VARCHAR(50),
  ADD COLUMN "cargo" VARCHAR(120),
  ADD COLUMN "departamento" VARCHAR(120),
  ADD COLUMN "data_admissao" TIMESTAMP(3),
  ADD COLUMN "data_demissao" TIMESTAMP(3),
  ADD COLUMN "salario_base" DECIMAL(15,2),
  ADD COLUMN "tipo_contrato" TEXT NOT NULL DEFAULT 'CLT',
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX "funcionario_ativo_idx" ON "common"."funcionario"("ativo");
CREATE UNIQUE INDEX "funcionario_organization_id_matricula_key"
  ON "common"."funcionario"("organization_id","matricula");

CREATE TYPE "financeiro"."StatusFolhaPagamento" AS ENUM ('ABERTA', 'FECHADA', 'PAGA', 'CANCELADA');
CREATE TYPE "financeiro"."TipoFolhaItem" AS ENUM ('SALARIO', 'HORA_EXTRA', 'BENEFICIO', 'DESCONTO', 'INSS', 'FGTS', 'IRRF', 'OUTRO');
CREATE TYPE "financeiro"."NaturezaFolhaItem" AS ENUM ('PROVENTO', 'DESCONTO', 'ENCARGO');

CREATE TABLE "financeiro"."folhas_pagamento" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "competencia" VARCHAR(7) NOT NULL,
  "referencia_mes" INTEGER NOT NULL,
  "referencia_ano" INTEGER NOT NULL,
  "status" "financeiro"."StatusFolhaPagamento" NOT NULL DEFAULT 'ABERTA',
  "data_fechamento" TIMESTAMP(3),
  "data_pagamento" TIMESTAMP(3),
  "observacoes" TEXT,
  "total_proventos" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "total_descontos" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "total_encargos" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "total_liquido" DECIMAL(15,2) NOT NULL DEFAULT 0,
  CONSTRAINT "folhas_pagamento_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "folhas_pagamento_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "folhas_pagamento_organization_id_competencia_key"
  ON "financeiro"."folhas_pagamento"("organization_id","competencia");
CREATE INDEX "folhas_pagamento_organization_id_referencia_ano_referencia_mes_idx"
  ON "financeiro"."folhas_pagamento"("organization_id","referencia_ano","referencia_mes");
CREATE INDEX "folhas_pagamento_status_idx"
  ON "financeiro"."folhas_pagamento"("status");

CREATE TABLE "financeiro"."folhas_pagamento_itens" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "organization_id" UUID NOT NULL,
  "folha_pagamento_id" UUID NOT NULL,
  "funcionario_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tipo" "financeiro"."TipoFolhaItem" NOT NULL,
  "natureza" "financeiro"."NaturezaFolhaItem" NOT NULL,
  "codigo" VARCHAR(30),
  "descricao" VARCHAR(255) NOT NULL,
  "referencia" VARCHAR(100),
  "valor" DECIMAL(15,2) NOT NULL,
  CONSTRAINT "folhas_pagamento_itens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "folhas_pagamento_itens_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "folhas_pagamento_itens_folha_pagamento_id_fkey"
    FOREIGN KEY ("folha_pagamento_id") REFERENCES "financeiro"."folhas_pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "folhas_pagamento_itens_funcionario_id_fkey"
    FOREIGN KEY ("funcionario_id") REFERENCES "common"."funcionario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "folhas_pagamento_itens_organization_id_idx"
  ON "financeiro"."folhas_pagamento_itens"("organization_id");
CREATE INDEX "folhas_pagamento_itens_folha_pagamento_id_idx"
  ON "financeiro"."folhas_pagamento_itens"("folha_pagamento_id");
CREATE INDEX "folhas_pagamento_itens_funcionario_id_idx"
  ON "financeiro"."folhas_pagamento_itens"("funcionario_id");
CREATE INDEX "folhas_pagamento_itens_natureza_idx"
  ON "financeiro"."folhas_pagamento_itens"("natureza");
