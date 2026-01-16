-- Function para atualizar status e dias restantes em vencimento_condicionante
CREATE OR REPLACE FUNCTION monitoramento.atualizar_status_vencimento_condicionante()
RETURNS TRIGGER AS $$
DECLARE
  v_prazoDias INTEGER;
  v_dataLimite DATE;
  v_frequencia TEXT;
  v_dataAtribuicao DATE;
BEGIN
  -- Pega o prazo e a frequência da condicionante relacionada
  SELECT c.prazo_dias, c.frequencia, lc.data_atribuicao
  INTO v_prazoDias, v_frequencia, v_dataAtribuicao
  FROM monitoramento.licenca_scondicionante lc
  JOIN monitoramento.condicionantes c 
    ON c.id = lc.condicionante_id
  WHERE lc.id = NEW.licenca_condicionante_id;

  -- Determina data limite de acordo com a frequência
  IF (v_frequencia = 'eventual') THEN
    v_dataLimite := v_dataAtribuicao + (INTERVAL '1 day' * v_prazoDias);
  ELSIF (v_frequencia IN ('unica', 'periodica')) THEN
    v_dataLimite := NEW.data_vencimento;
  ELSIF (v_frequencia = 'continua') THEN
    v_dataLimite := NULL;
  END IF;

  -- Define status com base nos dias restantes
  IF (NEW.status IS DISTINCT FROM 'concluida') THEN
    IF (v_frequencia = 'continua') THEN
      NEW.status := 'em_andamento';
    ELSIF (v_dataLimite > CURRENT_DATE) THEN
      NEW.status := 'pendente';
    ELSE
      NEW.status := 'atrasada';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Trigger deve ter nome simples (sem schema)
CREATE TRIGGER trigger_atualizar_status_vencimento_condicionante
BEFORE INSERT OR UPDATE ON monitoramento.vencimentos_condicionante
FOR EACH ROW
EXECUTE FUNCTION monitoramento.atualizar_status_vencimento_condicionante();
