-- AlterTable
ALTER TABLE "financeiro"."folhas_pagamento" ADD COLUMN "lancamento_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "folhas_pagamento_lancamento_id_key" ON "financeiro"."folhas_pagamento"("lancamento_id");

-- CreateIndex
CREATE INDEX "folhas_pagamento_lancamento_id_idx" ON "financeiro"."folhas_pagamento"("lancamento_id");

-- AddForeignKey
ALTER TABLE "financeiro"."folhas_pagamento" ADD CONSTRAINT "folhas_pagamento_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
