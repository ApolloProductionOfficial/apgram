-- Add missing columns to bot_questionnaire_questions if not exist
ALTER TABLE public.bot_questionnaire_questions ADD COLUMN IF NOT EXISTS options jsonb DEFAULT NULL;
ALTER TABLE public.bot_questionnaire_questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'text';

-- Update existing questions with options from bot
UPDATE public.bot_questionnaire_questions 
SET question_type = 'buttons', 
    options = '["🇷🇺 Россия", "🇺🇦 Украина", "🇧🇾 Беларусь", "🇰🇿 Казахстан", "🇺🇿 Узбекистан", "🇲🇩 Молдова", "🇵🇱 Польша", "🇬🇪 Грузия", "🌐 Другая страна"]'::jsonb
WHERE step = 'country';

UPDATE public.bot_questionnaire_questions 
SET question_type = 'buttons',
    options = '["👱‍♀️ Блондинка", "👩 Брюнетка", "👩‍🦰 Рыжая", "🧑‍🦳 Русая", "🎨 Цветные"]'::jsonb
WHERE step = 'hair_color';

UPDATE public.bot_questionnaire_questions 
SET question_type = 'multi_select',
    options = '[{"id": "solo", "name": "Соло контент", "emoji": "👤"}, {"id": "bg", "name": "B/G (с партнёром)", "emoji": "👫"}, {"id": "gg", "name": "G/G (лесби)", "emoji": "👩‍❤️‍👩"}, {"id": "fetish", "name": "Фетиш контент", "emoji": "🎭"}, {"id": "webcam", "name": "Вебкам трансляции", "emoji": "📺"}, {"id": "chat", "name": "Только чат/общение", "emoji": "💬"}]'::jsonb
WHERE step = 'content_types';

UPDATE public.bot_questionnaire_questions 
SET question_type = 'buttons',
    options = '["🆕 Нет опыта", "📱 Есть соцсети", "💰 Уже работаю моделью", "🌟 Опытная модель"]'::jsonb
WHERE step = 'experience';

UPDATE public.bot_questionnaire_questions 
SET question_type = 'buttons',
    options = '["📱 Только телефон", "💻 Телефон + ноутбук", "📷 Проф. камера + свет", "🎬 Полная студия"]'::jsonb
WHERE step = 'equipment';

UPDATE public.bot_questionnaire_questions 
SET question_type = 'buttons',
    options = '["🕐 2-3 часа/день", "🕓 4-6 часов/день", "🕗 8+ часов/день (Full-time)", "📅 Только по выходным"]'::jsonb
WHERE step = 'time_availability';

UPDATE public.bot_questionnaire_questions 
SET question_type = 'buttons',
    options = '["💵 $1,000-3,000", "💵💵 $3,000-5,000", "💵💵💵 $5,000-10,000", "💎 $10,000+"]'::jsonb
WHERE step = 'desired_income';

-- Insert missing questions that are in the bot but not in DB
INSERT INTO public.bot_questionnaire_questions (step, question, question_order, question_type, options, is_active)
VALUES 
  ('tabu_preferences', 'Отметьте то, что вы НЕ готовы делать (ТАБУ):', 10, 'multi_select', 
   '[{"id": "anal", "name": "Анал", "emoji": "🚫"}, {"id": "bdsm", "name": "BDSM", "emoji": "⛓️"}, {"id": "feet", "name": "Фут-фетиш", "emoji": "🦶"}, {"id": "roleplay", "name": "Ролевые игры", "emoji": "🎭"}, {"id": "public", "name": "Публичные места", "emoji": "🏙️"}, {"id": "toys", "name": "Игрушки", "emoji": "🎀"}, {"id": "dp", "name": "DP/Двойное", "emoji": "❌"}, {"id": "group", "name": "Групповое", "emoji": "👥"}, {"id": "outdoor", "name": "На улице", "emoji": "🌳"}, {"id": "facial", "name": "Фейшл", "emoji": "💦"}]'::jsonb, 
   true),
  ('portfolio_photos', 'Отправьте 1-5 ваших фотографий для портфолио:', 16, 'photos', null, true),
  ('strong_points', 'В чём ваши сильные стороны? Чем вы можете выделиться?', 18, 'text', null, true)
ON CONFLICT DO NOTHING;

-- Update question orders to match bot
UPDATE public.bot_questionnaire_questions SET question_order = 1 WHERE step = 'full_name';
UPDATE public.bot_questionnaire_questions SET question_order = 2 WHERE step = 'age';
UPDATE public.bot_questionnaire_questions SET question_order = 3 WHERE step = 'country';
UPDATE public.bot_questionnaire_questions SET question_order = 4 WHERE step = 'height_weight';
UPDATE public.bot_questionnaire_questions SET question_order = 5 WHERE step = 'body_params';
UPDATE public.bot_questionnaire_questions SET question_order = 6 WHERE step = 'hair_color';
UPDATE public.bot_questionnaire_questions SET question_order = 7 WHERE step = 'languages';
UPDATE public.bot_questionnaire_questions SET question_order = 8 WHERE step = 'platforms';
UPDATE public.bot_questionnaire_questions SET question_order = 9 WHERE step = 'content_types';
UPDATE public.bot_questionnaire_questions SET question_order = 10 WHERE step = 'tabu_preferences';
UPDATE public.bot_questionnaire_questions SET question_order = 11 WHERE step = 'experience';
UPDATE public.bot_questionnaire_questions SET question_order = 12 WHERE step = 'social_links';
UPDATE public.bot_questionnaire_questions SET question_order = 13 WHERE step = 'equipment';
UPDATE public.bot_questionnaire_questions SET question_order = 14 WHERE step = 'time_availability';
UPDATE public.bot_questionnaire_questions SET question_order = 15 WHERE step = 'desired_income';
UPDATE public.bot_questionnaire_questions SET question_order = 16 WHERE step = 'portfolio_photos';
UPDATE public.bot_questionnaire_questions SET question_order = 17 WHERE step = 'about_yourself';
UPDATE public.bot_questionnaire_questions SET question_order = 18 WHERE step = 'strong_points';