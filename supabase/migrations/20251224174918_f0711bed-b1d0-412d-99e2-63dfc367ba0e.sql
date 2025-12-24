-- Create table for questionnaire questions configuration
CREATE TABLE public.bot_questionnaire_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step TEXT NOT NULL UNIQUE,
  question TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  question_type TEXT DEFAULT 'text',
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_questionnaire_questions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage questions
CREATE POLICY "Admins can view questions" ON public.bot_questionnaire_questions FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert questions" ON public.bot_questionnaire_questions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update questions" ON public.bot_questionnaire_questions FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete questions" ON public.bot_questionnaire_questions FOR DELETE USING (is_admin());

-- Bot also needs to read questions (using service role)
CREATE POLICY "Bot can read questions" ON public.bot_questionnaire_questions FOR SELECT USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.bot_questionnaire_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default questions
INSERT INTO public.bot_questionnaire_questions (step, question, question_order, question_type) VALUES
  ('full_name', 'Как вас зовут? Напишите ваше полное имя:', 1, 'text'),
  ('age', 'Сколько вам полных лет? (только число)', 2, 'text'),
  ('country', 'Выберите вашу страну проживания:', 3, 'buttons'),
  ('height_weight', 'Укажите ваш рост и вес (например: 170 см / 55 кг):', 4, 'text'),
  ('body_params', 'Укажите ваши параметры фигуры (грудь-талия-бёдра):', 5, 'text'),
  ('hair_color', 'Выберите цвет волос:', 6, 'buttons'),
  ('languages', 'Какими языками вы владеете?', 7, 'text'),
  ('platforms', 'Есть ли у вас уже платформы, где вы работаете?', 8, 'text'),
  ('content_types', 'Какой контент вы готовы создавать?', 9, 'multi_select'),
  ('experience', 'У вас есть опыт работы моделью?', 10, 'buttons'),
  ('social_links', 'Отправьте ссылки на ваши соцсети:', 11, 'text'),
  ('equipment', 'Какое оборудование у вас есть для работы?', 12, 'buttons'),
  ('time_availability', 'Сколько времени вы готовы уделять работе?', 13, 'buttons'),
  ('desired_income', 'Какой доход вы хотите получать в месяц?', 14, 'buttons'),
  ('about_yourself', 'Расскажите о себе максимально подробно!', 15, 'text');

-- Add owner_telegram_chat_id to bot_welcome_settings for notifications
ALTER TABLE public.bot_welcome_settings ADD COLUMN IF NOT EXISTS owner_telegram_chat_id BIGINT;