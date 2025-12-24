-- Add description field to bot_questionnaire_questions for hints
ALTER TABLE public.bot_questionnaire_questions 
ADD COLUMN description text DEFAULT NULL;

-- Add new questions for content willingness and webcam
INSERT INTO public.bot_questionnaire_questions (step, question, question_order, question_type, options, is_active, description)
VALUES 
(
  'content_willingness',
  'Последний и самый важный опросник по содержанию вашего контента: Нужно будет поставить галочки напротив того, на что вы готовы и не ставить там, что для вас "ТАБУ"',
  13,
  'multi_select',
  '[
    {"id": "toys_video", "name": "Видео с игрушками (дилдо/вибратор и т.д.)", "emoji": "🎀"},
    {"id": "closeup_pussy", "name": "Крупный план Pussy", "emoji": "👀"},
    {"id": "closeup_butt", "name": "Крупный план попы", "emoji": "🍑"},
    {"id": "closeup_breasts", "name": "Крупный план груди", "emoji": "👙"},
    {"id": "closeup_feet", "name": "Крупный план стоп/ноги", "emoji": "🦶"},
    {"id": "finger_masturbation", "name": "Мастурбация пальцами", "emoji": "✋"},
    {"id": "vibrator_masturbation", "name": "Мастурбация (Вибратор)", "emoji": "📳"},
    {"id": "dildo_masturbation", "name": "Мастурбация Дилдо (дилдо вовнутрь)", "emoji": "🎯"},
    {"id": "erotic_lingerie", "name": "Эротическое нижнее бельё", "emoji": "🩱"},
    {"id": "stockings", "name": "Колготки/чулки", "emoji": "🧦"},
    {"id": "toy_bj", "name": "Минет с игрушкой", "emoji": "🍭"},
    {"id": "couple_content", "name": "Парный контент (есть подруга/друг)", "emoji": "👫"},
    {"id": "video_calls_eu", "name": "Согласны ли вы на кастомы/видеозвонки с европейцами?", "emoji": "📹"},
    {"id": "american_social", "name": "Согласны на создание американских соц.сетей?", "emoji": "🇺🇸"},
    {"id": "anal_penetration", "name": "Проникновение в анал", "emoji": "🔴"},
    {"id": "double_penetration", "name": "Двойное проникновение", "emoji": "⚠️"},
    {"id": "squirt", "name": "Сквирт", "emoji": "💦"}
  ]'::jsonb,
  true,
  'Отметьте галочками ВСЁ, что вы ГОТОВЫ делать. Не ставьте галочку на том, что для вас является ТАБУ.'
),
(
  'webcam_interest',
  'Работаете ли вы на вебкам платформах?',
  14,
  'buttons',
  '["✅ Да, уже работаю", "🆕 Нет, но хочу начать", "💡 Интересно, если помогут с оборудованием", "🏠 Интересно с переездом и ВНЖ в Грузии", "❌ Нет, не интересно"]'::jsonb,
  true,
  'Мы предоставляем полную поддержку: оборудование, финансовую помощь с переездами и получением ВНЖ в Грузии для наших моделей.'
);

-- Update existing questions with descriptive hints
UPDATE public.bot_questionnaire_questions 
SET description = 'Напишите ваше полное имя (Имя и Фамилия). Это важно для оформления документов и договоров.'
WHERE step = 'full_name';

UPDATE public.bot_questionnaire_questions 
SET description = 'Укажите ваш полный возраст. Минимальный возраст для работы — 18 лет.'
WHERE step = 'age';

UPDATE public.bot_questionnaire_questions 
SET description = 'Выберите страну, в которой вы сейчас проживаете.'
WHERE step = 'country';

UPDATE public.bot_questionnaire_questions 
SET description = 'Укажите точные параметры. Это важно для подбора контента и рекламных материалов.'
WHERE step = 'height_weight';

UPDATE public.bot_questionnaire_questions 
SET description = 'Укажите ваши параметры в формате: грудь-талия-бёдра (например: 90-60-90).'
WHERE step = 'body_params';

UPDATE public.bot_questionnaire_questions 
SET description = 'Выберите ваш основной цвет волос.'
WHERE step = 'hair_color';

UPDATE public.bot_questionnaire_questions 
SET description = 'Перечислите все языки, которыми владеете, и уровень владения (например: Русский — родной, English — B2).'
WHERE step = 'languages';

UPDATE public.bot_questionnaire_questions 
SET description = 'Если у вас уже есть аккаунты на платформах (OnlyFans, Fansly и т.д.), напишите их. Если нет — напишите "Нет".'
WHERE step = 'platforms';

UPDATE public.bot_questionnaire_questions 
SET description = 'Выберите все типы контента, которые вы готовы создавать. Можно выбрать несколько вариантов.'
WHERE step = 'content_types';

UPDATE public.bot_questionnaire_questions 
SET description = 'ВАЖНО! Отметьте здесь то, что вы категорически НЕ готовы делать. Это ваши личные границы, мы их уважаем.'
WHERE step = 'tabu_preferences';

UPDATE public.bot_questionnaire_questions 
SET description = 'Расскажите о вашем опыте. Это поможет нам лучше понять ваш уровень и предложить подходящие условия.'
WHERE step = 'experience';

UPDATE public.bot_questionnaire_questions 
SET description = 'Отправьте ссылки на ваши Instagram, TikTok, Twitter или другие соцсети. Каждую ссылку с новой строки.'
WHERE step = 'social_links';