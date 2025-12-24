-- Таблица для хранения состояния заполнения анкеты через бота
CREATE TABLE public.telegram_model_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  telegram_user_id BIGINT NOT NULL,
  telegram_username TEXT,
  step TEXT NOT NULL DEFAULT 'start',
  
  -- Данные анкеты
  full_name TEXT,
  age INTEGER,
  country TEXT,
  height TEXT,
  weight TEXT,
  body_params TEXT,
  hair_color TEXT,
  language_skills TEXT,
  platforms TEXT[] DEFAULT '{}',
  content_preferences TEXT[] DEFAULT '{}',
  social_media_experience TEXT[] DEFAULT '{}',
  social_media_links TEXT,
  equipment TEXT,
  time_availability TEXT,
  desired_income TEXT,
  about_yourself TEXT,
  strong_points TEXT,
  
  -- Статус
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.telegram_model_applications ENABLE ROW LEVEL SECURITY;

-- Политики для бота (без авторизации через JWT)
CREATE POLICY "Bot can insert applications" 
ON public.telegram_model_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Bot can update applications" 
ON public.telegram_model_applications 
FOR UPDATE 
USING (true);

CREATE POLICY "Bot can select applications" 
ON public.telegram_model_applications 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can delete applications" 
ON public.telegram_model_applications 
FOR DELETE 
USING (is_admin());

-- Триггер для updated_at
CREATE TRIGGER update_telegram_model_applications_updated_at
BEFORE UPDATE ON public.telegram_model_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы
CREATE INDEX idx_telegram_model_applications_chat_id ON public.telegram_model_applications(chat_id);
CREATE INDEX idx_telegram_model_applications_status ON public.telegram_model_applications(status);