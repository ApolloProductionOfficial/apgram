-- Таблица для хранения быстрых фраз
CREATE TABLE public.telegram_quick_phrases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  phrase TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица для хранения сообщений чата (для саммари)
CREATE TABLE public.telegram_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  text TEXT,
  is_voice BOOLEAN DEFAULT false,
  transcription TEXT,
  translation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица настроек чатов
CREATE TABLE public.telegram_chat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  summary_enabled BOOLEAN DEFAULT true,
  summary_time TEXT DEFAULT '21:00',
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX idx_chat_messages_chat_id ON public.telegram_chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON public.telegram_chat_messages(created_at);

-- RLS
ALTER TABLE public.telegram_quick_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_chat_settings ENABLE ROW LEVEL SECURITY;

-- Политики для quick_phrases (пользователь видит только свои)
CREATE POLICY "Users can view own phrases" ON public.telegram_quick_phrases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own phrases" ON public.telegram_quick_phrases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phrases" ON public.telegram_quick_phrases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phrases" ON public.telegram_quick_phrases
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для chat_messages (публичный доступ для бота, чтение для владельца)
CREATE POLICY "Bot can insert messages" ON public.telegram_chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Bot can select messages" ON public.telegram_chat_messages
  FOR SELECT USING (true);

-- Политики для chat_settings
CREATE POLICY "Anyone can insert settings" ON public.telegram_chat_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view settings" ON public.telegram_chat_settings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update settings" ON public.telegram_chat_settings
  FOR UPDATE USING (true);