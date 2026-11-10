-- =============================================================
-- 006 - Conta administradora e troca de síndico (RN.04/RN.06 revisadas) — issue #39
-- - sessao_versao: muda quando o perfil/unidade/ativo do vínculo muda, derrubando
--   as sessões abertas daquele vínculo (o JWT carrega a versão).
-- - encerrado_em: vínculo encerrado (ex.: síndico sem unidade que deixou a função);
--   não confunde com cadastro pendente de aprovação.
-- - No máximo um síndico ativo por condomínio.
-- =============================================================
ALTER TABLE vinculos_condominio
  -- Colunas novas do vínculo (explicadas no cabeçalho acima).
  ADD COLUMN sessao_versao integer NOT NULL DEFAULT 0,
  ADD COLUMN encerrado_em  timestamptz;

-- Índice único parcial: só pode existir um vínculo SINDICO ativo por condomínio.
CREATE UNIQUE INDEX ux_um_sindico_ativo
  ON vinculos_condominio (condominio_id)
  WHERE perfil = 'SINDICO' AND ativo;
