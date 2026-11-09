-- =============================================================
-- 005 - Portaria e controle de visitantes (RF.10 / RN.14) — issue #32
-- Registra como a visita foi autorizada (pré-autorização do morador,
-- confirmação pelo app ou pelo interfone) e quando.
-- =============================================================
ALTER TABLE visitas
  ADD COLUMN autorizacao_via varchar(20)
    CHECK (autorizacao_via IN ('PRE_AUTORIZACAO', 'APP', 'INTERFONE')),
  ADD COLUMN autorizado_em   timestamptz,
  ADD COLUMN cancelado_em    timestamptz;

ALTER TABLE visitas
  ADD CONSTRAINT ck_visita_autorizacao
  CHECK ((autorizado_por_id IS NULL) = (autorizacao_via IS NULL));
