-- Добавляем колонку для хранения usernames членов команды
ALTER TABLE bot_welcome_settings 
ADD COLUMN IF NOT EXISTS team_usernames jsonb DEFAULT '{}'::jsonb;