DROP VIEW IF EXISTS monitoramento.totais_dashboard;

CREATE OR REPLACE FUNCTION monitoramento.totais_dashboard_pessoa(pessoa_id_input UUID DEFAULT NULL)
RETURNS TABLE (
    total_pessoas NUMERIC,
    total_condicionantes NUMERIC,
    total_condicionantes_vencendo_mes NUMERIC
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::NUMERIC FROM pessoa WHERE pessoa_id_input IS NULL OR id = pessoa_id_input),

        (SELECT COUNT(*)::NUMERIC
         FROM monitoramento.condicionantes c
         JOIN monitoramento.licencas_condicionante lc ON lc.condicionante_id = c.id
         JOIN monitoramento.licencas l ON l.id = lc.licenca_id
         WHERE pessoa_id_input IS NULL OR l.pessoa_id = pessoa_id_input),

        -- Total de condicionantes com vencimento neste mês e status pendente
        (SELECT COUNT(*)::NUMERIC
         FROM monitoramento.licencas_condicionante lc
         JOIN monitoramento.condicionantes c ON c.id = lc.condicionante_id
         JOIN monitoramento.licencas l ON l.id = lc.licenca_id
         LEFT JOIN monitoramento.vencimentos_condicionante vc ON vc.licenca_condicionante_id = lc.id
         WHERE (pessoa_id_input IS NULL OR l.pessoa_id = pessoa_id_input)
           AND vc.status = 'pendente'
           AND date_trunc('month', vc.data_vencimento) = date_trunc('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql;
