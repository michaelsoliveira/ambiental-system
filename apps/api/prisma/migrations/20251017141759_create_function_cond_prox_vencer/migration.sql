-- This is an empty migration.DROP VIEW IF EXISTS vw_evolucao_cumprimento_mensal;

DROP FUNCTION IF EXISTS monitoramento.condicionantes_proximas_vencer;

CREATE OR REPLACE FUNCTION monitoramento.condicionantes_proximas_vencer(pessoa_id_input UUID DEFAULT NULL)
RETURNS TABLE(
	id UUID,
    descricao TEXT,
    data_limite TIMESTAMP WITHOUT TIME ZONE,
    status TEXT,
    pessoa TEXT
)
AS $$
BEGIN
    RETURN QUERY
		SELECT 
	c.id,
	c.descricao,
	COALESCE(vc.data_vencimento, calcular_data_limite(lc.data_atribuicao::date, c.prazo_dias)::timestamp without time zone) AS data_limite,
	vc.status,
	CASE
		WHEN p.tipo = 'J'::tipo_pessoa THEN pj.razao_social
		WHEN p.tipo = 'F'::tipo_pessoa THEN pf.nome
		ELSE 'N/A'::text
	END AS pessoa
FROM monitoramento.licencas_condicionante lc
 JOIN monitoramento.condicionantes c ON lc.condicionante_id = c.id
 JOIN monitoramento.licencas l ON l.id = lc.licenca_id
 JOIN common.pessoas p ON p.id = l.pessoa_id
	LEFT JOIN common.pessoas_fisica pf ON pf.pessoa_id = p.id
	LEFT JOIN common.pessoas_juridica pj ON pj.pessoa_id = p.id
	LEFT JOIN monitoramento.vencimentos_condicionante vc ON vc.licenca_condicionante_id = lc.id
WHERE
	(vc.status = 'pendente'::text
	 AND COALESCE(vc.data_vencimento, calcular_data_limite(lc.data_atribuicao::date, c.prazo_dias)::timestamp without time zone) >= CURRENT_DATE
	 AND COALESCE(vc.data_vencimento, calcular_data_limite(lc.data_atribuicao::date, c.prazo_dias)::timestamp without time zone) <= (CURRENT_DATE + INTERVAL '30 days')
	 AND (
		pessoa_id_input IS NULL OR l.pessoa_id = pessoa_id_input
	 )
	)
ORDER BY COALESCE(vc.data_vencimento, calcular_data_limite(lc.data_atribuicao::date, c.prazo_dias)::timestamp without time zone)
LIMIT 10;
END;
$$ LANGUAGE plpgsql;