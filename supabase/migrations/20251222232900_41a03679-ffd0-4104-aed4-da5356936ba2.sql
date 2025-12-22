-- Создаём bucket для медиафайлов бота
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bot-media', 'bot-media', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для bucket
CREATE POLICY "Authenticated users can upload media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'bot-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view bot media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'bot-media');

CREATE POLICY "Users can delete their own media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'bot-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Добавляем поле для кастомных эмодзи
ALTER TABLE public.telegram_quick_phrases
ADD COLUMN IF NOT EXISTS custom_emoji_id TEXT;

-- Включаем realtime для истории сообщений
ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_chat_messages;