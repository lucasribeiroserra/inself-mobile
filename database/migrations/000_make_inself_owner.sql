-- Executar como SUPERUSUÁRIO (dono atual do banco ou postgres).
-- Torna o role "inself" dono do banco e de todas as tabelas/sequences do schema public.
-- No pgAdmin: conecte como dono do banco, abra o Query Tool, cole este arquivo e execute.

-- 1) Garantir que o role inself existe (cria se não existir; senha 'inself')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'inself') THEN
    CREATE ROLE inself LOGIN PASSWORD 'inself';
  ELSE
    ALTER ROLE inself WITH PASSWORD 'inself';
  END IF;
END $$;

-- 2) Trocar o dono do banco para inself
ALTER DATABASE inself OWNER TO inself;

-- 3) Trocar o dono de todas as tabelas do schema public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO inself', r.tablename);
  END LOOP;
END $$;

-- 4) Trocar o dono de todas as sequences do schema public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public')
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO inself', r.sequencename);
  END LOOP;
END $$;

-- 5) Dar permissões no schema (caso inself ainda não tenha)
GRANT ALL ON SCHEMA public TO inself;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inself;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inself;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO inself;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO inself;
