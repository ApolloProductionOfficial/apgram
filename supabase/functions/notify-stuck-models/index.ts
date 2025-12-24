import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STEP_LABELS: Record<string, string> = {
  start: 'Начало',
  welcome: 'Приветствие',
  full_name: 'Имя',
  age: 'Возраст',
  country: 'Страна',
  height_weight: 'Рост/Вес',
  body_params: 'Параметры',
  hair_color: 'Цвет волос',
  languages: 'Языки',
  platforms: 'Платформы',
  social_links: 'Соцсети',
  equipment: 'Оборудование',
  time_availability: 'Время',
  desired_income: 'Доход',
  portfolio_photos: 'Фото',
  about_yourself: 'О себе',
  content_willingness: 'Готовность',
  strong_points: 'Сильные стороны',
  complete: 'Завершено'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const botToken = Deno.env.get('MODEL_BOT_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get stuck applications (more than 24 hours in_progress)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: stuckApplications, error: appsError } = await supabase
      .from('telegram_model_applications')
      .select('*')
      .eq('status', 'in_progress')
      .neq('step', 'complete')
      .lt('updated_at', twentyFourHoursAgo);

    if (appsError) {
      console.error('Error fetching stuck applications:', appsError);
      throw appsError;
    }

    if (!stuckApplications || stuckApplications.length === 0) {
      console.log('No stuck applications found');
      return new Response(
        JSON.stringify({ success: true, message: 'No stuck applications', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${stuckApplications.length} stuck applications`);

    // Get notification settings
    const { data: settings } = await supabase
      .from('bot_welcome_settings')
      .select('owner_telegram_chat_id, notification_chat_ids')
      .limit(1)
      .maybeSingle();

    if (!settings?.owner_telegram_chat_id) {
      console.log('No owner chat ID configured');
      return new Response(
        JSON.stringify({ success: false, message: 'No owner chat ID configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect all chat IDs to notify
    const chatIds = [settings.owner_telegram_chat_id];
    if (settings.notification_chat_ids) {
      chatIds.push(...settings.notification_chat_ids);
    }

    // Send notifications for each stuck application
    const notificationResults = [];
    
    for (const app of stuckApplications) {
      const hoursStuck = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60));
      const stepLabel = STEP_LABELS[app.step] || app.step;
      
      // Сообщение для команды
      const teamMessage = `⚠️ <b>Модель застряла на анкете!</b>

👤 <b>Имя:</b> ${app.full_name || 'Не указано'}
📱 <b>Telegram:</b> ${app.telegram_username ? `@${app.telegram_username}` : `ID: ${app.telegram_user_id}`}
⏱ <b>Заполняет уже:</b> ${hoursStuck} ч.
📍 <b>Застряла на:</b> ${stepLabel}

💡 <i>Напишите модели и узнайте, что случилось — возможно ей нужна помощь!</i>`;

      // Отправляем уведомление команде
      for (const chatId of chatIds) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: teamMessage,
              parse_mode: 'HTML',
              reply_markup: app.telegram_username ? {
                inline_keyboard: [[
                  { text: '💬 Написать модели', url: `https://t.me/${app.telegram_username}` }
                ]]
              } : undefined
            }),
          });
          
          const result = await response.json();
          notificationResults.push({ chatId, appId: app.id, success: result.ok });
          console.log(`Team notification sent to ${chatId} for app ${app.id}:`, result.ok);
        } catch (err) {
          console.error(`Failed to send team notification to ${chatId}:`, err);
          notificationResults.push({ chatId, appId: app.id, success: false, error: String(err) });
        }
      }

      // Отправляем напоминание самой модели
      try {
        const modelMessage = `👋 <b>Привет!</b>

Заметили, что вы начали заполнять анкету, но ещё не закончили 🤔

❓ <b>Что-то не устроило? Возникли вопросы?</b>

Вы можете написать напрямую нашему владельцу @Apollo_Production — он детальнее выслушает ваши сомнения и даст рекомендации!

Мы будем рады помочь 💜`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: app.chat_id,
            text: modelMessage,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📝 Продолжить анкету', callback_data: 'app_continue' }],
                [{ text: '💬 Написать владельцу', url: 'https://t.me/Apollo_Production' }]
              ]
            }
          }),
        });
        console.log(`Reminder sent to model ${app.telegram_username || app.chat_id}`);
      } catch (err) {
        console.error(`Failed to send reminder to model:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stuckCount: stuckApplications.length,
        notifications: notificationResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-stuck-models:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});