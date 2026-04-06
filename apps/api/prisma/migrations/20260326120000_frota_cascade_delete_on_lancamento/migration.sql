-- Ao excluir um lançamento vinculado à frota, remove o registro operacional (abastecimento, manutenção ou viagem)
-- para não ficar órfão com lancamento_id nulo.

ALTER TABLE "frota"."abastecimentos" DROP CONSTRAINT "abastecimentos_lancamento_id_fkey";

ALTER TABLE "frota"."abastecimentos" ADD CONSTRAINT "abastecimentos_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "frota"."manutencoes" DROP CONSTRAINT "manutencoes_lancamento_id_fkey";

ALTER TABLE "frota"."manutencoes" ADD CONSTRAINT "manutencoes_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "frota"."viagens" DROP CONSTRAINT "viagens_lancamento_id_fkey";

ALTER TABLE "frota"."viagens" ADD CONSTRAINT "viagens_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "financeiro"."lancamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
