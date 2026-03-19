-- Google auth + avatar: password_hash opcional (OAuth), avatar na tabela user_profiles

-- Usuários que entram só pelo Google não têm senha
ALTER TABLE public.users
  ALTER COLUMN password_hash DROP NOT NULL;

-- Avatar (URL da foto do Google ou outro provedor)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;
