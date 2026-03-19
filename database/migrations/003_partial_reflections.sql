-- Reflexão parcial (salvar sem preencher jornada): primeira pergunta + quote/citação
ALTER TABLE public.user_reflections
  ADD COLUMN IF NOT EXISTS first_prompt text;

ALTER TABLE public.user_reflections
  ALTER COLUMN answer_identifique DROP NOT NULL,
  ALTER COLUMN answer_aceite DROP NOT NULL,
  ALTER COLUMN answer_aja DROP NOT NULL;
