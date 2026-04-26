-- Tipos de folha e rubricas parametrizadas por organização.

CREATE TYPE "financeiro"."TipoFolhaPagamento" AS ENUM (
  'FOLHA_MENSAL',
  'FERIAS',
  'DECIMO_TERCEIRO',
  'RESCISAO'
);

ALTER TABLE "financeiro"."folhas_pagamento"
  ADD COLUMN "tipo" "financeiro"."TipoFolhaPagamento" NOT NULL DEFAULT 'FOLHA_MENSAL';

DROP INDEX IF EXISTS "financeiro"."folhas_pagamento_organization_id_competencia_key";

CREATE UNIQUE INDEX "folhas_pagamento_organization_id_competencia_tipo_key"
  ON "financeiro"."folhas_pagamento"("organization_id", "competencia", "tipo");

CREATE INDEX "folhas_pagamento_tipo_idx"
  ON "financeiro"."folhas_pagamento"("tipo");

CREATE TABLE "financeiro"."rubricas_folha" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "organization_id" UUID NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "codigo" VARCHAR(30),
  "nome" VARCHAR(255) NOT NULL,
  "tipo_folha" "financeiro"."TipoFolhaPagamento" NOT NULL,
  "tipo_item" "financeiro"."TipoFolhaItem" NOT NULL DEFAULT 'OUTRO',
  "natureza" "financeiro"."NaturezaFolhaItem" NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT TRUE,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "rubricas_folha_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rubricas_folha_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "rubricas_folha_organization_id_tipo_folha_nome_key"
  ON "financeiro"."rubricas_folha"("organization_id", "tipo_folha", "nome");
CREATE INDEX "rubricas_folha_organization_id_tipo_folha_ativo_idx"
  ON "financeiro"."rubricas_folha"("organization_id", "tipo_folha", "ativo");
CREATE INDEX "rubricas_folha_natureza_idx"
  ON "financeiro"."rubricas_folha"("natureza");

ALTER TABLE "financeiro"."folhas_pagamento_itens"
  ADD COLUMN "rubrica_id" UUID;

ALTER TABLE "financeiro"."folhas_pagamento_itens"
  ADD CONSTRAINT "folhas_pagamento_itens_rubrica_id_fkey"
  FOREIGN KEY ("rubrica_id") REFERENCES "financeiro"."rubricas_folha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "folhas_pagamento_itens_rubrica_id_idx"
  ON "financeiro"."folhas_pagamento_itens"("rubrica_id");

-- Seed inicial conforme planilha-base. Uma cópia por organização para permitir customização futura.
INSERT INTO "financeiro"."rubricas_folha" (
  "organization_id", "nome", "tipo_folha", "tipo_item", "natureza", "ordem"
)
SELECT org."id", seed."nome", seed."tipo_folha"::"financeiro"."TipoFolhaPagamento",
       seed."tipo_item"::"financeiro"."TipoFolhaItem",
       seed."natureza"::"financeiro"."NaturezaFolhaItem",
       seed."ordem"
FROM "common"."organizations" org
CROSS JOIN (
  VALUES
    ('Salário', 'FOLHA_MENSAL', 'SALARIO', 'PROVENTO', 10),
    ('Ajuda de custo', 'FOLHA_MENSAL', 'BENEFICIO', 'PROVENTO', 20),
    ('INSS', 'FOLHA_MENSAL', 'INSS', 'DESCONTO', 30),
    ('FGTS', 'FOLHA_MENSAL', 'FGTS', 'ENCARGO', 40),
    ('Hora extra 50%', 'FOLHA_MENSAL', 'HORA_EXTRA', 'PROVENTO', 50),
    ('Hora extra 100%', 'FOLHA_MENSAL', 'HORA_EXTRA', 'PROVENTO', 60),
    ('IRRF', 'FOLHA_MENSAL', 'IRRF', 'DESCONTO', 70),
    ('13º salário', 'FOLHA_MENSAL', 'OUTRO', 'PROVENTO', 80),
    ('Reflexo DSR', 'FOLHA_MENSAL', 'OUTRO', 'PROVENTO', 90),
    ('Salário Família', 'FOLHA_MENSAL', 'BENEFICIO', 'PROVENTO', 100),

    ('Férias Proporcionais', 'FERIAS', 'OUTRO', 'PROVENTO', 10),
    ('13º Férias', 'FERIAS', 'OUTRO', 'PROVENTO', 20),
    ('1/3 sob férias', 'FERIAS', 'OUTRO', 'PROVENTO', 30),
    ('Aviso Prévio indenizado', 'FERIAS', 'OUTRO', 'PROVENTO', 40),
    ('INSS sob férias', 'FERIAS', 'INSS', 'DESCONTO', 50),
    ('FGTS sob férias', 'FERIAS', 'FGTS', 'ENCARGO', 60),
    ('IRRF sob férias', 'FERIAS', 'IRRF', 'DESCONTO', 70),

    ('1ª Parcela 13º', 'DECIMO_TERCEIRO', 'OUTRO', 'PROVENTO', 10),
    ('2ª Parcela 13º', 'DECIMO_TERCEIRO', 'OUTRO', 'PROVENTO', 20),
    ('Adiantamento 13º', 'DECIMO_TERCEIRO', 'OUTRO', 'PROVENTO', 30),
    ('INSS sob 13º', 'DECIMO_TERCEIRO', 'INSS', 'DESCONTO', 40),
    ('FGTS sob 13º', 'DECIMO_TERCEIRO', 'FGTS', 'ENCARGO', 50),

    ('Saldo dias Trabalhados', 'RESCISAO', 'SALARIO', 'PROVENTO', 10),
    ('Ajuste de saldo devedor', 'RESCISAO', 'DESCONTO', 'DESCONTO', 20),
    ('Aviso Prévio Indenizado', 'RESCISAO', 'OUTRO', 'PROVENTO', 30),
    ('Férias proporcionais', 'RESCISAO', 'OUTRO', 'PROVENTO', 40),
    ('13º salário Proporcional', 'RESCISAO', 'OUTRO', 'PROVENTO', 50),
    ('Terço constitucional de Férias', 'RESCISAO', 'OUTRO', 'PROVENTO', 60)
) AS seed("nome", "tipo_folha", "tipo_item", "natureza", "ordem")
ON CONFLICT ("organization_id", "tipo_folha", "nome") DO NOTHING;
