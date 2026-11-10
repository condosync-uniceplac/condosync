-- =============================================================
-- 008 - Chamados no banco (RN.22 / bug #18) — issue #42
-- Foto opcional do chamado guardada na própria tabela, como nos avisos (007):
-- PNG ou JPG (ou PDF) de até 2 MB, baixada por rota autenticada.
-- =============================================================
ALTER TABLE anexos_chamado
  ADD COLUMN conteudo bytea,
  ADD CONSTRAINT ck_anexo_chamado_tamanho CHECK (tamanho_bytes <= 2097152);

CREATE INDEX IF NOT EXISTS ix_chamados_unidade ON chamados (unidade_id);
