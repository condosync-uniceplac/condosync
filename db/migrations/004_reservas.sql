-- =============================================================
-- 004 - Reservas de áreas comuns (RF.09 / RN.12) — issue #31
-- Número de convidados e data de cancelamento; índice para checar conflitos
-- só entre reservas ativas.
-- =============================================================
ALTER TABLE reservas
  -- convidados: quantas pessoas o morador vai levar (comparado com a capacidade do espaço).
  ADD COLUMN convidados   integer NOT NULL DEFAULT 0 CHECK (convidados >= 0),
  ADD COLUMN cancelada_em timestamptz;

ALTER TABLE reservas
  -- Reserva cancelada precisa ter a data do cancelamento, e só ela pode ter.
  ADD CONSTRAINT ck_reserva_cancelada
  CHECK ((status = 'CANCELADA') = (cancelada_em IS NOT NULL));

-- Índice só das reservas ativas, usado para checar conflito de horário.
CREATE INDEX ix_reservas_ativas ON reservas (espaco_id, inicio, fim)
  WHERE status IN ('PENDENTE', 'CONFIRMADA');
