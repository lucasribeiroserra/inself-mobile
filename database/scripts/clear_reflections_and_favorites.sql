-- Apaga todos os registros de histórico de reflexões, favoritos, check-in/check-out emocional e badges.
-- Execute como dono do banco no pgAdmin (Query Tool no banco inself) para recomeçar os testes.

DELETE FROM public.user_reflection_favorites;
DELETE FROM public.user_badges;
DELETE FROM public.user_reflections;
DELETE FROM public.emotional_checkouts;
DELETE FROM public.emotional_checkins;
