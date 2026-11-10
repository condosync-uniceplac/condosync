-- =============================================================
-- CondoSync - dados de DESENVOLVIMENTO
-- !! NÃO usar em produção. Senhas de teste públicas (ver README). !!
-- Senha de todos os usuários: Condo@2026  (hash bcrypt, custo 10)
-- =============================================================

-- Condomínio, blocos e unidades -------------------------------
INSERT INTO condominios (nome, cnpj, cep, logradouro, numero, bairro, cidade, uf)
VALUES ('Residencial Vila Aurora', '12345678000190', '01310100', 'Avenida das Flores', '1000',
        'Jardim Aurora', 'São Paulo', 'SP');

INSERT INTO blocos (condominio_id, nome)
SELECT c.id, b.nome
FROM condominios c
CROSS JOIN (VALUES ('A'), ('B'), ('C')) AS b (nome)
WHERE c.cnpj = '12345678000190';

INSERT INTO unidades (bloco_id, numero)
SELECT b.id, u.numero
FROM blocos b
JOIN condominios c ON c.id = b.condominio_id AND c.cnpj = '12345678000190'
CROSS JOIN (VALUES ('101'), ('102'), ('201'), ('202')) AS u (numero);

-- Usuários (um por perfil) -------------------------------------
INSERT INTO usuarios (nome_completo, email, telefone, cpf, data_nascimento, senha_hash) VALUES
  ('Maria Moradora',  'morador@condosync.dev',  '11990000001', '11144477735', '1990-05-10',
   '$2b$10$H3O3fOzomoH.D1PT/0JBle4GrNNpr3LuDNARXrUbGgwsFTK/25jNy'),
  ('Paulo Portaria',  'portaria@condosync.dev', '11990000002', '22255588846', '1985-08-20',
   '$2b$10$H3O3fOzomoH.D1PT/0JBle4GrNNpr3LuDNARXrUbGgwsFTK/25jNy'),
  ('Sandra Síndica',  'sindico@condosync.dev',  '11990000003', '33366699957', '1978-02-15',
   '$2b$10$H3O3fOzomoH.D1PT/0JBle4GrNNpr3LuDNARXrUbGgwsFTK/25jNy');

-- Liga cada usuário de teste ao condomínio com o seu perfil (e unidade, quando tem).
INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, unidade_id)
SELECT u.id, c.id, v.perfil::perfil_acesso,
       (SELECT un.id FROM unidades un JOIN blocos b ON b.id = un.bloco_id
         WHERE b.condominio_id = c.id AND b.nome = v.bloco AND un.numero = v.unidade)
FROM (VALUES
  ('morador@condosync.dev',  'MORADOR',  'A',  '101'),
  ('portaria@condosync.dev', 'PORTARIA', NULL, NULL),
  ('sindico@condosync.dev',  'SINDICO',  NULL, NULL)
) AS v (email, perfil, bloco, unidade)
JOIN usuarios u ON u.email = v.email
CROSS JOIN condominios c
WHERE c.cnpj = '12345678000190';

-- Termos de uso / política de privacidade (texto provisório) ---
INSERT INTO termos_documentos (tipo, versao, conteudo) VALUES
  ('TERMOS_USO', '1.0-dev', 'Termos de Uso do CondoSync (texto provisório para desenvolvimento).'),
  ('POLITICA_PRIVACIDADE', '1.0-dev', 'Política de Privacidade do CondoSync (texto provisório para desenvolvimento).');

-- Marca que os usuários de teste aceitaram os termos.
INSERT INTO aceites_termos (usuario_id, termo_id, ip)
SELECT u.id, t.id, '127.0.0.1'::inet
FROM usuarios u CROSS JOIN termos_documentos t
WHERE u.email IN ('morador@condosync.dev', 'portaria@condosync.dev', 'sindico@condosync.dev');

-- Espaços ------------------------------------------------------
INSERT INTO espacos (condominio_id, nome, descricao, capacidade_pessoas, valor)
SELECT c.id, e.nome, e.descricao, e.capacidade, e.valor
FROM condominios c
CROSS JOIN (VALUES
  ('Salão de Festas', 'Salão com cozinha de apoio e mesas para 80 pessoas.', 80, 250.00),
  ('Churrasqueira',   'Área gourmet com churrasqueira e pia.',               30, 100.00),
  ('Quadra',          'Quadra poliesportiva coberta.',                       20,   0.00)
) AS e (nome, descricao, capacidade, valor)
WHERE c.cnpj = '12345678000190';

-- Avisos (autor: síndica) --------------------------------------
INSERT INTO avisos (condominio_id, categoria_id, autor_id, titulo, corpo, prioridade)
SELECT v.condominio_id, ca.id, v.id, a.titulo, a.corpo, a.prioridade::prioridade_aviso
FROM vinculos_condominio v
JOIN usuarios u ON u.id = v.usuario_id AND u.email = 'sindico@condosync.dev'
JOIN (VALUES
  ('Assembleias', 'Assembleia geral ordinária',
   'Convocamos todos os condôminos para a assembleia no salão de festas, dia 15, às 19h.', 'NORMAL'),
  ('Manutenção', 'Interrupção no fornecimento de água',
   'Na próxima terça, das 9h às 13h, a água será interrompida para limpeza das caixas.', 'URGENTE')
) AS a (categoria, titulo, corpo, prioridade) ON true
JOIN categorias_aviso ca ON ca.nome = a.categoria
WHERE v.perfil = 'SINDICO';

-- Chamado (solicitante: moradora) ------------------------------
INSERT INTO chamados (condominio_id, solicitante_id, unidade_id, categoria_id, urgencia, titulo, descricao)
SELECT v.condominio_id, v.id, v.unidade_id, cc.id, 'ALTA',
       'Lâmpada queimada na garagem',
       'A lâmpada próxima à vaga 12 do bloco A está queimada há uma semana.'
FROM vinculos_condominio v
JOIN usuarios u ON u.id = v.usuario_id AND u.email = 'morador@condosync.dev'
JOIN categorias_chamado cc ON cc.nome = 'Manutenção'
WHERE v.perfil = 'MORADOR';

-- Enquete com opções (criador: síndica) ------------------------
WITH nova AS (
  INSERT INTO enquetes (condominio_id, criador_id, pergunta, descricao, encerra_em)
  SELECT v.condominio_id, v.id,
         'Qual o melhor horário para a academia funcionar aos domingos?',
         'Votação para definir o novo horário de funcionamento.',
         now() + interval '30 days'
  FROM vinculos_condominio v
  JOIN usuarios u ON u.id = v.usuario_id AND u.email = 'sindico@condosync.dev'
  WHERE v.perfil = 'SINDICO'
  RETURNING id
)
INSERT INTO enquete_opcoes (enquete_id, texto, ordem)
SELECT nova.id, o.texto, o.ordem
FROM nova
CROSS JOIN (VALUES ('Das 6h às 12h', 1), ('Das 8h às 18h', 2), ('Das 6h às 22h', 3)) AS o (texto, ordem);
