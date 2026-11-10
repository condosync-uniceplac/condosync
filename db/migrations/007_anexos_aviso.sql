-- =============================================================
-- 007 - Anexos do mural de avisos guardados no banco (RN.20 / bug #19) — issue #41
-- O projeto não usa um serviço de arquivos separado: o anexo (PDF, PNG ou JPG,
-- até 2 MB) fica na própria tabela, e o download sai por uma rota autenticada.
-- =============================================================
ALTER TABLE anexos_aviso
  -- conteudo: bytes do arquivo; o CHECK limita a 2 MB (2 * 1024 * 1024 bytes).
  ADD COLUMN conteudo bytea,
  ADD CONSTRAINT ck_anexo_tamanho CHECK (tamanho_bytes <= 2097152);
