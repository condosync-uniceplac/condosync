-- Conta rápida de demonstração (QR code da apresentação).
-- Marca os usuários criados pela tela /demo: o perfil deles fica só para leitura e,
-- depois da apresentação, todos são apagados de uma vez (scripts/limpar-demo.sql).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS demo boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS usuarios_demo_idx ON usuarios (demo) WHERE demo;
