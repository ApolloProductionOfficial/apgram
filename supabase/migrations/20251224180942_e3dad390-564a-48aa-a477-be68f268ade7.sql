-- Add columns for photo uploads and TABU preferences to telegram_model_applications
ALTER TABLE public.telegram_model_applications
ADD COLUMN IF NOT EXISTS portfolio_photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tabu_preferences text[] DEFAULT '{}';

-- Add column for multiple notification IDs in bot_welcome_settings  
ALTER TABLE public.bot_welcome_settings
ADD COLUMN IF NOT EXISTS notification_chat_ids bigint[] DEFAULT '{}';

-- Update owner_contact default
UPDATE public.bot_welcome_settings 
SET owner_contact = '@Apollo_Produciton'
WHERE owner_contact = '@ApolloProductionOwner';