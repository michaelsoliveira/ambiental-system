-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "omnichannel";

-- CreateTable
CREATE TABLE "omnichannel"."oc_canal" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ia_habilitada" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "oc_canal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_contato" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(200),
    "telefone" VARCHAR(30),
    "email" VARCHAR(200),
    "avatar_url" VARCHAR(500),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extra_data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "oc_contato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_agente" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(40) NOT NULL DEFAULT 'worker',
    "categoria" VARCHAR(100),
    "modelo" VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    "system_prompt" TEXT NOT NULL DEFAULT '',
    "contexto_operacional" TEXT,
    "temperatura" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" UUID,
    "departamento" VARCHAR(100),
    "squad" VARCHAR(100),
    "max_tokens" INTEGER NOT NULL DEFAULT 1024,
    "timeout_ms" INTEGER NOT NULL DEFAULT 30000,

    CONSTRAINT "oc_agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_tool" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "tipo" VARCHAR(40) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "oc_tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_skill" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(100),
    "descricao_llm" TEXT NOT NULL,
    "tool_id" UUID,
    "parameters_schema" JSONB NOT NULL DEFAULT '{}',
    "invocation_config" JSONB NOT NULL DEFAULT '{}',
    "instrucoes_extras" TEXT,
    "timeout_ms" INTEGER NOT NULL DEFAULT 15000,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "oc_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_agente_skill" (
    "agente_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,

    CONSTRAINT "oc_agente_skill_pkey" PRIMARY KEY ("agente_id","skill_id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_conversa" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "canal_id" UUID NOT NULL,
    "contato_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'bot',
    "agente_ia_id" UUID,
    "atendente_id" UUID,
    "is_stuck" BOOLEAN NOT NULL DEFAULT false,
    "stuck_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(6),
    "last_bot_at" TIMESTAMP(6),
    "first_response_at" TIMESTAMP(6),
    "snoozed_until" TIMESTAMP(6),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canal_ext_id" VARCHAR(200),
    "extra_data" JSONB NOT NULL DEFAULT '{}',
    "closed_at" TIMESTAMP(6),

    CONSTRAINT "oc_conversa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_mensagem" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "conversa_id" UUID NOT NULL,
    "autor_tipo" VARCHAR(20) NOT NULL,
    "autor_id" UUID,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'text',
    "conteudo" TEXT NOT NULL,
    "canal_msg_id" VARCHAR(200),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "extra_data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "oc_mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_execucao" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "conversa_id" UUID,
    "agente_id" UUID,
    "skill_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "input_data" JSONB,
    "output_data" JSONB,
    "error_msg" TEXT,
    "tokens_input" INTEGER,
    "tokens_output" INTEGER,
    "duration_ms" INTEGER,
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(6),

    CONSTRAINT "oc_execucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_pipeline" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "oc_pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_pipeline_stage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pipeline_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "cor" VARCHAR(20) NOT NULL DEFAULT 'gray',
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "oc_pipeline_stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_pipeline_card" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "pipeline_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "conversa_id" UUID,
    "titulo" VARCHAR(200),
    "valor_estimado" DECIMAL(12,2),
    "won" BOOLEAN NOT NULL DEFAULT false,
    "lost" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(6),

    CONSTRAINT "oc_pipeline_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_automacao" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "trigger_tipo" VARCHAR(40) NOT NULL,
    "condicoes" JSONB NOT NULL DEFAULT '[]',
    "acoes" JSONB NOT NULL DEFAULT '[]',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "limite_rpm" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "oc_automacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_watchdog_config" (
    "organization_id" UUID NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "threshold_bot_min" INTEGER NOT NULL DEFAULT 15,
    "threshold_pending_min" INTEGER NOT NULL DEFAULT 15,
    "threshold_open_min" INTEGER NOT NULL DEFAULT 60,
    "max_tentativas" INTEGER NOT NULL DEFAULT 3,
    "horario_24h" BOOLEAN NOT NULL DEFAULT true,
    "horario_config" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oc_watchdog_config_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_config_ia" (
    "organization_id" UUID NOT NULL,
    "ia_habilitada" BOOLEAN NOT NULL DEFAULT true,
    "pausar_ia_humano_responde" BOOLEAN NOT NULL DEFAULT true,
    "atendimento_24h" BOOLEAN NOT NULL DEFAULT true,
    "horario_config" JSONB NOT NULL DEFAULT '{}',
    "mensagem_fora_horario" TEXT,
    "contexto_negocio" TEXT,
    "limite_tokens_mes" INTEGER,
    "dominios_permitidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "handoff_keywords" JSONB NOT NULL DEFAULT '[]',
    "resumo_modelo" VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oc_config_ia_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_inbox" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "icone" VARCHAR(50) NOT NULL DEFAULT 'inbox',
    "cor" VARCHAR(20) NOT NULL DEFAULT 'gray',
    "filtros" JSONB NOT NULL DEFAULT '{}',
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "oc_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_tag" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "cor" VARCHAR(20) NOT NULL DEFAULT 'blue',

    CONSTRAINT "oc_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omnichannel"."oc_api_key" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "key_hash" VARCHAR(200) NOT NULL,
    "key_prefix" VARCHAR(20) NOT NULL,
    "criado_por" UUID,
    "ultima_vez" TIMESTAMP(6),

    CONSTRAINT "oc_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oc_canal_organization_id_idx" ON "omnichannel"."oc_canal"("organization_id");

-- CreateIndex
CREATE INDEX "oc_contato_organization_id_idx" ON "omnichannel"."oc_contato"("organization_id");

-- CreateIndex
CREATE INDEX "oc_contato_telefone_idx" ON "omnichannel"."oc_contato"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "oc_contato_organization_id_telefone_key" ON "omnichannel"."oc_contato"("organization_id", "telefone");

-- CreateIndex
CREATE INDEX "oc_agente_organization_id_idx" ON "omnichannel"."oc_agente"("organization_id");

-- CreateIndex
CREATE INDEX "oc_tool_organization_id_idx" ON "omnichannel"."oc_tool"("organization_id");

-- CreateIndex
CREATE INDEX "oc_skill_organization_id_idx" ON "omnichannel"."oc_skill"("organization_id");

-- CreateIndex
CREATE INDEX "oc_conversa_organization_id_idx" ON "omnichannel"."oc_conversa"("organization_id");

-- CreateIndex
CREATE INDEX "oc_conversa_organization_id_status_idx" ON "omnichannel"."oc_conversa"("organization_id", "status");

-- CreateIndex
CREATE INDEX "oc_conversa_organization_id_canal_id_idx" ON "omnichannel"."oc_conversa"("organization_id", "canal_id");

-- CreateIndex
CREATE INDEX "oc_conversa_organization_id_last_message_at_idx" ON "omnichannel"."oc_conversa"("organization_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "oc_mensagem_canal_msg_id_key" ON "omnichannel"."oc_mensagem"("canal_msg_id");

-- CreateIndex
CREATE INDEX "oc_mensagem_organization_id_idx" ON "omnichannel"."oc_mensagem"("organization_id");

-- CreateIndex
CREATE INDEX "oc_mensagem_conversa_id_idx" ON "omnichannel"."oc_mensagem"("conversa_id");

-- CreateIndex
CREATE INDEX "oc_execucao_organization_id_started_at_idx" ON "omnichannel"."oc_execucao"("organization_id", "started_at");

-- CreateIndex
CREATE INDEX "oc_pipeline_organization_id_idx" ON "omnichannel"."oc_pipeline"("organization_id");

-- CreateIndex
CREATE INDEX "oc_pipeline_stage_pipeline_id_idx" ON "omnichannel"."oc_pipeline_stage"("pipeline_id");

-- CreateIndex
CREATE INDEX "oc_pipeline_card_organization_id_idx" ON "omnichannel"."oc_pipeline_card"("organization_id");

-- CreateIndex
CREATE INDEX "oc_pipeline_card_pipeline_id_idx" ON "omnichannel"."oc_pipeline_card"("pipeline_id");

-- CreateIndex
CREATE INDEX "oc_automacao_organization_id_idx" ON "omnichannel"."oc_automacao"("organization_id");

-- CreateIndex
CREATE INDEX "oc_inbox_organization_id_idx" ON "omnichannel"."oc_inbox"("organization_id");

-- CreateIndex
CREATE INDEX "oc_tag_organization_id_idx" ON "omnichannel"."oc_tag"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "oc_tag_organization_id_nome_key" ON "omnichannel"."oc_tag"("organization_id", "nome");

-- CreateIndex
CREATE INDEX "oc_api_key_organization_id_idx" ON "omnichannel"."oc_api_key"("organization_id");

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_canal" ADD CONSTRAINT "oc_canal_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_contato" ADD CONSTRAINT "oc_contato_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_agente" ADD CONSTRAINT "oc_agente_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_agente" ADD CONSTRAINT "oc_agente_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "omnichannel"."oc_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_tool" ADD CONSTRAINT "oc_tool_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_skill" ADD CONSTRAINT "oc_skill_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_skill" ADD CONSTRAINT "oc_skill_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "omnichannel"."oc_tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_agente_skill" ADD CONSTRAINT "oc_agente_skill_agente_id_fkey" FOREIGN KEY ("agente_id") REFERENCES "omnichannel"."oc_agente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_agente_skill" ADD CONSTRAINT "oc_agente_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "omnichannel"."oc_skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_conversa" ADD CONSTRAINT "oc_conversa_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_conversa" ADD CONSTRAINT "oc_conversa_canal_id_fkey" FOREIGN KEY ("canal_id") REFERENCES "omnichannel"."oc_canal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_conversa" ADD CONSTRAINT "oc_conversa_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "omnichannel"."oc_contato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_conversa" ADD CONSTRAINT "oc_conversa_agente_ia_id_fkey" FOREIGN KEY ("agente_ia_id") REFERENCES "omnichannel"."oc_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_mensagem" ADD CONSTRAINT "oc_mensagem_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_mensagem" ADD CONSTRAINT "oc_mensagem_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "omnichannel"."oc_conversa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_execucao" ADD CONSTRAINT "oc_execucao_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_execucao" ADD CONSTRAINT "oc_execucao_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "omnichannel"."oc_conversa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_execucao" ADD CONSTRAINT "oc_execucao_agente_id_fkey" FOREIGN KEY ("agente_id") REFERENCES "omnichannel"."oc_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_execucao" ADD CONSTRAINT "oc_execucao_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "omnichannel"."oc_skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_pipeline" ADD CONSTRAINT "oc_pipeline_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_pipeline_stage" ADD CONSTRAINT "oc_pipeline_stage_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "omnichannel"."oc_pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_pipeline_card" ADD CONSTRAINT "oc_pipeline_card_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_pipeline_card" ADD CONSTRAINT "oc_pipeline_card_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "omnichannel"."oc_pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_pipeline_card" ADD CONSTRAINT "oc_pipeline_card_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "omnichannel"."oc_pipeline_stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_pipeline_card" ADD CONSTRAINT "oc_pipeline_card_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "omnichannel"."oc_conversa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_automacao" ADD CONSTRAINT "oc_automacao_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_watchdog_config" ADD CONSTRAINT "oc_watchdog_config_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_config_ia" ADD CONSTRAINT "oc_config_ia_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_inbox" ADD CONSTRAINT "oc_inbox_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_tag" ADD CONSTRAINT "oc_tag_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omnichannel"."oc_api_key" ADD CONSTRAINT "oc_api_key_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

