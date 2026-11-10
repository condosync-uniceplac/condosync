-- =============================================================
-- 009 - Enquetes: um voto por unidade (RN.24, versão 2) — issue #43
-- Antes o voto era por usuário (uma família com várias contas votaria várias
-- vezes). Agora a chave é (enquete, unidade): quem votar por último na unidade
-- substitui o voto, até o encerramento. usuario_id guarda quem votou.
-- =============================================================
ALTER TABLE votos_enquete ADD COLUMN unidade_id bigint REFERENCES unidades (id);

-- Votos antigos herdam a unidade do vínculo ativo do usuário (o mais recente fica)
UPDATE votos_enquete ve
   SET unidade_id = v.unidade_id
  FROM vinculos_condominio v
  JOIN enquetes e ON e.condominio_id = v.condominio_id
 WHERE v.usuario_id = ve.usuario_id AND e.id = ve.enquete_id AND v.ativo AND v.unidade_id IS NOT NULL;
DELETE FROM votos_enquete WHERE unidade_id IS NULL;
DELETE FROM votos_enquete a USING votos_enquete b
 WHERE a.enquete_id = b.enquete_id AND a.unidade_id = b.unidade_id AND a.atualizado_em < b.atualizado_em;

ALTER TABLE votos_enquete
  ALTER COLUMN unidade_id SET NOT NULL,
  DROP CONSTRAINT votos_enquete_pkey,
  ADD PRIMARY KEY (enquete_id, unidade_id);
CREATE INDEX ix_votos_usuario_enquete ON votos_enquete (enquete_id, usuario_id);

-- Encerramento antecipado pelo síndico (encerra_em passa a ser o momento do encerramento)
ALTER TABLE enquetes ADD COLUMN encerrada_por bigint REFERENCES vinculos_condominio (id);
