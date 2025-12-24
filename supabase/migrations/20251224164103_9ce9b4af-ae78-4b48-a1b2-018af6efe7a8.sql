-- Таблица для настроек приветствия бота моделей
CREATE TABLE public.bot_welcome_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  welcome_message text NOT NULL DEFAULT 'Добро пожаловать в Apollo Production!',
  welcome_media_url text,
  welcome_media_type text DEFAULT 'video', -- video, animation, photo
  owner_contact text DEFAULT '@ApolloProductionOwner',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS для настроек приветствия
ALTER TABLE public.bot_welcome_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bot settings" ON public.bot_welcome_settings
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert bot settings" ON public.bot_welcome_settings
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update bot settings" ON public.bot_welcome_settings
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete bot settings" ON public.bot_welcome_settings
  FOR DELETE USING (is_admin());

-- Вставляем дефолтные настройки
INSERT INTO public.bot_welcome_settings (welcome_message, welcome_media_url, welcome_media_type, owner_contact)
VALUES (
  '🌟 <b>Добро пожаловать в Apollo Production!</b>

Мы — ведущее агентство по работе с моделями на топовых платформах.

💰 <b>Что мы предлагаем:</b>
• Доход от $3,000 до $50,000+ в месяц
• Полное обучение и поддержка 24/7
• Продвижение и раскрутка аккаунтов
• Помощь с контентом и стратегией
• Выгодные условия сотрудничества

📋 Заполните анкету, чтобы мы могли предложить вам лучшие условия!',
  'https://ykwiqymksnndugphhgmc.supabase.co/storage/v1/object/public/bot-media/welcome-model.mp4',
  'video',
  '@ApolloProductionOwner'
);

-- Trigger для updated_at
CREATE TRIGGER update_bot_welcome_settings_updated_at
  BEFORE UPDATE ON public.bot_welcome_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();