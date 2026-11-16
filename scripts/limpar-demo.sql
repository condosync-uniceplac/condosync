-- Apaga as contas da demonstração (QR code) e tudo o que a plateia criou com elas.
-- Uso, depois da apresentação: rodar no SQL Editor do Supabase (ou psql) e
-- remover DEMO_CODIGO das variáveis do Vercel para desligar o link.
BEGIN;

CREATE TEMP TABLE demo_vinculos ON COMMIT DROP AS
  SELECT v.id FROM vinculos_condominio v JOIN usuarios u ON u.id = v.usuario_id WHERE u.demo;

-- Chamados abertos pela plateia (o histórico e as fotos saem junto) e comentários dela.
DELETE FROM chamados WHERE solicitante_id IN (SELECT id FROM demo_vinculos);
DELETE FROM chamado_acompanhamentos WHERE autor_id IN (SELECT id FROM demo_vinculos);

-- Visitas e reservas feitas pela plateia; visitantes que ficaram sem nenhuma visita.
DELETE FROM visitas
 WHERE registrada_por_id IN (SELECT id FROM demo_vinculos)
    OR autorizado_por_id IN (SELECT id FROM demo_vinculos);
DELETE FROM visitantes vt WHERE NOT EXISTS (SELECT 1 FROM visitas v WHERE v.visitante_id = vt.id);
DELETE FROM reservas WHERE vinculo_id IN (SELECT id FROM demo_vinculos);

-- Usuários de demonstração: vínculos, votos, leituras e aceites saem em cascata.
DELETE FROM usuarios WHERE demo;

COMMIT;
