DROP VIEW IF EXISTS monitoramento.vw_evolucao_cumprimento_mensal;

DROP FUNCTION IF EXISTS monitoramento.evolucao_cumprimento_mensal;

CREATE OR REPLACE FUNCTION monitoramento.evolucao_cumprimento_mensal(pessoa_id_input UUID DEFAULT NULL)
RETURNS TABLE (
    ano NUMERIC,
    mes NUMERIC,
    cumprido NUMERIC
)
AS $$
BEGIN
	RETURN QUERY
	SELECT 
		EXTRACT(year FROM vc.data_cumprimento)::NUMERIC AS ano,
		EXTRACT(month FROM vc.data_cumprimento)::NUMERIC AS mes,
		count(*) FILTER (WHERE vc.status = 'concluida'::text)::NUMERIC AS cumprido
	FROM monitoramento.licencas_condicionante lc
		JOIN monitoramento.condicionantes c ON c.id = lc.condicionante_id
		JOIN monitoramento.licencas l ON l.id = lc.licenca_id
		LEFT JOIN monitoramento.vencimentos_condicionante vc ON vc.licenca_condicionante_id = lc.id
	WHERE pessoa_id_input IS NULL OR (l.pessoa_id = pessoa_id_input AND vc.data_cumprimento IS NOT NULL)
	GROUP BY (EXTRACT(year FROM vc.data_cumprimento)::NUMERIC), (EXTRACT(month FROM vc.data_cumprimento)::NUMERIC)
	ORDER BY (EXTRACT(year FROM vc.data_cumprimento)::NUMERIC), (EXTRACT(month FROM vc.data_cumprimento)::NUMERIC);
END;
$$ LANGUAGE plpgsql;