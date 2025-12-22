-- Добавляем колонку media_url для хранения ссылки на медиафайл (GIF/картинка/видео)
ALTER TABLE public.telegram_quick_phrases
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('photo', 'video', 'animation', NULL));

-- Исправляем существующие команды - убираем слеш если есть
UPDATE public.telegram_quick_phrases
SET command = REPLACE(command, '/', '')
WHERE command LIKE '/%';