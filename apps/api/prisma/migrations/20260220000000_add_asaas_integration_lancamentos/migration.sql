-- AlterTable: Lancamento - adicionar campos de integração Asaas e controle interno
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "controle_interno" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "gerar_boleto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "permitir_pix" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "asaas_payment_id" VARCHAR(255);
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "invoice_url" VARCHAR(500);
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "boleto_url" VARCHAR(500);
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "boleto_linha_digitavel" VARCHAR(100);
ALTER TABLE "financeiro"."lancamentos" ADD COLUMN "pix_qrcode_url" VARCHAR(500);

-- AlterTable: LancamentoRecorrente - adicionar campos Asaas
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD COLUMN "gerar_boleto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD COLUMN "permitir_pix" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "financeiro"."lancamentos_recorrentes" ADD COLUMN "asaas_subscription_id" VARCHAR(255);

-- AlterTable: ConfiguracaoFinanceira - adicionar API key do Asaas
ALTER TABLE "financeiro"."configuracao_financeira" ADD COLUMN "asaas_api_key" VARCHAR(255);

-- AlterTable: Pessoa (common schema) - adicionar ID do cliente Asaas
ALTER TABLE "common"."pessoas" ADD COLUMN "asaas_customer_id" VARCHAR(255);
