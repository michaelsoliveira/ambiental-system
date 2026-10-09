-- CPF/CNPJ passam a ser únicos só dentro da organização.
-- O índice global fazia o cadastro em uma organização nova estourar 500
-- quando o documento já existia em outra.
DROP INDEX IF EXISTS "common"."pessoas_juridica_cnpj_key";
DROP INDEX IF EXISTS "public"."pessoas_juridica_cnpj_key";
DROP INDEX IF EXISTS "common"."pessoas_fisica_cpf_key";
DROP INDEX IF EXISTS "public"."pessoas_fisica_cpf_key";
