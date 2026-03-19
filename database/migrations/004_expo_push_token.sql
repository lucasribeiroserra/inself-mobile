-- Adiciona coluna para token do Expo Push (notificações por usuário)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS expo_push_token text;

COMMENT ON COLUMN public.user_settings.expo_push_token IS 'Token Expo Push para envio de notificações (lembrete diário).';
