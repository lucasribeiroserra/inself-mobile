-- InSelf: schema PostgreSQL standalone (sem Supabase)
-- Execute no pgAdmin (ou psql) no banco que você criou para o app.
-- Ex.: CREATE DATABASE inself; \c inself

-- ========== USUÁRIOS (auth na API com JWT) ==========

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== CONTEÚDO (admin) ==========

CREATE TABLE IF NOT EXISTS public.emotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('initial', 'final')),
  slug text NOT NULL UNIQUE,
  label_pt text NOT NULL,
  label_en text NOT NULL,
  icon text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  icon text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.virtues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  description_pt text,
  description_en text,
  icon text NOT NULL,
  max_points int NOT NULL DEFAULT 100,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reflection_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id),
  virtue_id uuid NOT NULL REFERENCES public.virtues(id),
  quote text NOT NULL,
  author text NOT NULL,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reflection_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_content_id uuid NOT NULL REFERENCES public.reflection_content(id) ON DELETE CASCADE,
  step_key text NOT NULL CHECK (step_key IN ('identifique', 'aceite', 'aja')),
  label_pt text NOT NULL,
  prompt_pt text NOT NULL,
  prompt_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reflection_content_id, step_key)
);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  description_pt text,
  description_en text,
  icon text NOT NULL,
  required_checkins int NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  virtue_id uuid REFERENCES public.virtues(id),
  slug text NOT NULL UNIQUE,
  title_pt text NOT NULL,
  title_en text NOT NULL,
  description_pt text,
  description_en text,
  duration int NOT NULL CHECK (duration IN (3, 7, 14)),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  icon text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  prompt_pt text NOT NULL,
  prompt_en text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, day_number)
);

-- ========== USUÁRIO E PREFERÊNCIAS ==========

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  gender text,
  birth_date date,
  locale text NOT NULL DEFAULT 'pt-BR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_time text NOT NULL DEFAULT '07:00',
  preferred_category_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== JORNADA ==========

CREATE TABLE IF NOT EXISTS public.emotional_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emotion_id uuid NOT NULL REFERENCES public.emotions(id),
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reflection_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reflection_content_id uuid NOT NULL REFERENCES public.reflection_content(id),
  emotional_checkin_id uuid REFERENCES public.emotional_checkins(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.reflection_session_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_session_id uuid NOT NULL REFERENCES public.reflection_sessions(id) ON DELETE CASCADE,
  step_key text NOT NULL CHECK (step_key IN ('identifique', 'aceite', 'aja')),
  answer_text text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reflection_session_id, step_key)
);

CREATE TABLE IF NOT EXISTS public.emotional_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emotion_id uuid NOT NULL REFERENCES public.emotions(id),
  reflection_session_id uuid REFERENCES public.reflection_sessions(id) ON DELETE SET NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reflection_session_id uuid REFERENCES public.reflection_sessions(id) ON DELETE SET NULL,
  reflection_content_id uuid REFERENCES public.reflection_content(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  message text NOT NULL,
  quote text NOT NULL,
  author text NOT NULL,
  answer_identifique text NOT NULL,
  answer_aceite text NOT NULL,
  answer_aja text NOT NULL,
  checkin_count_at_time int NOT NULL,
  badge_earned_id uuid REFERENCES public.badges(id),
  category_slug text,
  virtue_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reflection_favorites (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_reflection_id uuid NOT NULL REFERENCES public.user_reflections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, user_reflection_id)
);

-- ========== GAMIFICAÇÃO ==========

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  user_reflection_id uuid REFERENCES public.user_reflections(id) ON DELETE SET NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.virtue_progress (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  virtue_id uuid NOT NULL REFERENCES public.virtues(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, virtue_id)
);

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_reflection_date date,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  current_day int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_challenge_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id uuid NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  answer_text text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_challenge_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_emotional_checkins_user_id ON public.emotional_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_reflection_sessions_user_id ON public.reflection_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_checkouts_user_id ON public.emotional_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reflections_user_id ON public.user_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reflections_completed_at ON public.user_reflections(completed_at DESC);

-- ========== SEED (emotions, categories, virtues, reflection, badges) ==========

INSERT INTO public.emotions (type, slug, label_pt, label_en, icon, sort_order) VALUES
('initial', 'anxious', 'Ansioso(a)', 'Anxious', 'anxious', 1),
('initial', 'stressed', 'Estressado(a)', 'Stressed', 'stressed', 2),
('initial', 'confused', 'Confuso(a)', 'Confused', 'confused', 3),
('initial', 'unmotivated', 'Desmotivado(a)', 'Unmotivated', 'unmotivated', 4),
('initial', 'calm', 'Calmo(a)', 'Calm', 'calm', 5),
('initial', 'confident', 'Confiante', 'Confident', 'confident', 6),
('initial', 'seeking-self-love', 'Buscando amor-próprio', 'Seeking self-love', 'seeking-self-love', 7),
('initial', 'seeking-discipline', 'Buscando disciplina', 'Seeking discipline', 'seeking-discipline', 8),
('final', 'better', 'Melhor', 'Better', 'trending-up', 1),
('final', 'same', 'Igual', 'Same', 'arrow-right', 2),
('final', 'worse', 'Pior', 'Worse', 'trending-down', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name_pt, name_en, icon, sort_order) VALUES
('anxiety', 'Ansiedade', 'Anxiety', 'wave', 1),
('stress', 'Estresse', 'Stress', 'yoga', 2),
('self-love', 'Amor Próprio', 'Self-love', 'heart', 3),
('discipline', 'Disciplina', 'Discipline', 'sword-cross', 4),
('purpose', 'Propósito', 'Purpose', 'compass', 5),
('relationships', 'Relacionamentos', 'Relationships', 'handshake', 6),
('resilience', 'Resiliência', 'Resilience', 'fire', 7),
('mental-clarity', 'Clareza Mental', 'Mental clarity', 'diamond', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.virtues (slug, name_pt, name_en, description_pt, icon, max_points, sort_order) VALUES
('clarity', 'Clareza', 'Clarity', 'Enxergar a realidade com lucidez', 'diamond', 100, 1),
('serenity', 'Serenidade', 'Serenity', 'Manter a calma interior diante do caos', 'dove', 100, 2),
('courage', 'Coragem', 'Courage', 'Enfrentar o desconhecido com firmeza', 'fire', 100, 3),
('discipline', 'Disciplina', 'Discipline', 'Dominar a vontade com constância', 'sword-cross', 100, 4),
('self-mastery', 'Autodomínio', 'Self-Mastery', 'Governar impulsos e emoções', 'crown', 100, 5),
('wisdom', 'Sabedoria', 'Wisdom', 'Aplicar o conhecimento com discernimento', 'book-open', 100, 6),
('integrity', 'Integridade', 'Integrity', 'Agir de acordo com seus princípios', 'shield', 100, 7),
('inself', 'Inself', 'Inself', 'A excelência moral completa', 'domain', 100, 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.reflection_content (category_id, virtue_id, quote, author, message)
SELECT c.id, v.id,
  'Você tem poder sobre sua mente — não sobre os eventos externos.',
  'Marcus Aurelius',
  'Você não precisa controlar o dia inteiro. Apenas controle a próxima decisão.'
FROM public.categories c, public.virtues v
WHERE c.slug = 'anxiety' AND v.slug = 'serenity'
LIMIT 1;

INSERT INTO public.reflection_steps (reflection_content_id, step_key, label_pt, prompt_pt, prompt_en, sort_order)
SELECT rc.id, step_key, label_pt, prompt_pt, prompt_en, ord
FROM public.reflection_content rc
CROSS JOIN (VALUES
  ('identifique', 'Identifique', 'O que está causando ansiedade em você neste momento?', 'What is causing anxiety in you right now?', 1),
  ('aceite', 'Aceite', 'Quais dessas preocupações estão fora do seu controle?', 'Which of these worries are outside your control?', 2),
  ('aja', 'Aja', 'Que ação concreta você pode tomar agora sobre o que está ao seu alcance?', 'What concrete action can you take now about what is within your reach?', 3)
) AS s(step_key, label_pt, prompt_pt, prompt_en, ord)
WHERE rc.author = 'Marcus Aurelius' AND rc.quote LIKE 'Você tem poder%'
ON CONFLICT (reflection_content_id, step_key) DO NOTHING;

INSERT INTO public.reflection_content (category_id, virtue_id, quote, author, message)
SELECT c.id, v.id, q.quote, q.author, q.message
FROM (VALUES
  ('stress', 'courage', 'Não é o que acontece com você, mas como você reage que importa.', 'Epictetus', 'A adversidade não é sua inimiga. Sua reação é o que define o caminho.'),
  ('self-love', 'wisdom', 'A felicidade da sua vida depende da qualidade dos seus pensamentos.', 'Marcus Aurelius', 'Seus pensamentos moldam sua realidade. Escolha-os com cuidado.'),
  ('discipline', 'integrity', 'Primeiro diga a si mesmo o que você seria; e então faça o que tem que fazer.', 'Epictetus', 'A disciplina começa com clareza sobre quem você quer ser.')
) AS q(cat_slug, virt_slug, quote, author, message)
JOIN public.categories c ON c.slug = q.cat_slug
JOIN public.virtues v ON v.slug = q.virt_slug
ON CONFLICT DO NOTHING;

INSERT INTO public.badges (slug, name_pt, name_en, description_pt, icon, required_checkins, sort_order) VALUES
('desperto', 'Desperto', 'Awakened', 'Completou sua primeira reflexão', 'sprout', 1, 1),
('atento', 'Atento', 'Attentive', '3 dias de reflexão', 'eye', 3, 2),
('discipulo', 'Discípulo', 'Disciple', '7 dias de reflexão', 'book-open', 7, 3),
('estoico', 'Estoico', 'Stoic', '15 dias de reflexão', 'domain', 15, 4),
('contemplador', 'Contemplador', 'Contemplator', '30 dias de reflexão', 'mirror', 30, 5),
('estrategista', 'Estrategista', 'Strategist', '60 dias de reflexão', 'chess-knight', 60, 6),
('sabio', 'Sábio', 'Wise', '100 dias de reflexão', 'star', 100, 7),
('virtuoso', 'Virtuoso', 'Virtuous', '150 dias de reflexão', 'crown', 150, 8)
ON CONFLICT (slug) DO NOTHING;
