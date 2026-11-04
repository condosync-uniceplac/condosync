-- O CondoSync acessa o banco apenas pelo servidor (Next.js, conexão PostgreSQL direta).
-- No Supabase, o schema public também é exposto pela Data API (PostgREST) com a chave
-- pública "anon". Para que ninguém leia ou altere dados por esse caminho:
--   1. RLS ligado em todas as tabelas, sem políticas -> anon/authenticated não veem nada;
--   2. privilégios dos papéis da API revogados.
-- O usuário da aplicação (dono das tabelas) não é afetado.
-- Em um PostgreSQL comum (Docker de desenvolvimento) os papéis anon/authenticated não
-- existem, então essa parte é ignorada.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
  END IF;
END
$$;
