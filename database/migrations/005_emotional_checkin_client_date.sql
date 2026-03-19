-- Permite que o app envie a data local (um check-in por dia no fuso do usuário).
ALTER TABLE public.emotional_checkins
  ADD COLUMN IF NOT EXISTS client_date date;

-- Preencher registros antigos com a data do checked_at (em UTC).
UPDATE public.emotional_checkins
  SET client_date = (checked_at AT TIME ZONE 'UTC')::date
  WHERE client_date IS NULL;
