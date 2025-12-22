-- Добавляем поля для включения/выключения функций бота в таблицу telegram_chat_settings
ALTER TABLE public.telegram_chat_settings
ADD COLUMN IF NOT EXISTS translator_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quick_phrases_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS chat_title TEXT;