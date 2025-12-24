import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL_BOT_TOKEN = Deno.env.get('MODEL_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Типы контента
const CONTENT_TYPES = [
  { id: 'solo', name: 'Соло контент', emoji: '👤' },
  { id: 'bg', name: 'B/G (с партнёром)', emoji: '👫' },
  { id: 'gg', name: 'G/G (лесби)', emoji: '👩‍❤️‍👩' },
  { id: 'fetish', name: 'Фетиш контент', emoji: '🎭' },
  { id: 'webcam', name: 'Вебкам трансляции', emoji: '📺' },
  { id: 'chat', name: 'Только чат/общение', emoji: '💬' },
];

// Получение настроек приветствия
async function getWelcomeSettings() {
  const { data } = await supabase
    .from('bot_welcome_settings')
    .select('*')
    .limit(1)
    .single();
  
  return data || {
    welcome_message: '🌟 <b>Добро пожаловать в Apollo Production!</b>',
    welcome_media_url: null,
    welcome_media_type: 'video',
    owner_contact: '@ApolloProductionOwner'
  };
}

// Отправка сообщения с inline кнопками
async function sendMessageWithButtons(chatId: number, text: string, buttons: any[][], replyToMessageId?: number) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: buttons
    }
  };
  
  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  if (!result.ok) {
    console.error('sendMessageWithButtons error:', result);
  }
  return result;
}

// Редактирование сообщения
async function editMessage(chatId: number, messageId: number, text: string, buttons?: any[][]) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/editMessageText`;
  
  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
  };
  
  if (buttons) {
    body.reply_markup = { inline_keyboard: buttons };
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Ответ на callback query
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/answerCallbackQuery`;
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
    }),
  });
}

// Отправка сообщения в Telegram
async function sendMessage(chatId: number, text: string, replyToMessageId?: number) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text: text,
    reply_to_message_id: replyToMessageId,
    parse_mode: 'HTML',
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  if (!result.ok) {
    console.error('sendMessage error:', result);
  }
}

// Отправка видео
async function sendVideo(chatId: number, videoUrl: string, caption?: string) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendVideo`;
  
  const body: any = {
    chat_id: chatId,
    video: videoUrl,
    caption: caption,
    parse_mode: 'HTML',
  };
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Отправка GIF/анимации
async function sendAnimation(chatId: number, animationUrl: string, caption?: string) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendAnimation`;
  
  const body: any = {
    chat_id: chatId,
    animation: animationUrl,
    caption: caption,
    parse_mode: 'HTML',
  };
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Отправка фото
async function sendPhoto(chatId: number, photoUrl: string, caption?: string) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendPhoto`;
  
  const body: any = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
    parse_mode: 'HTML',
  };
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ===================== АНКЕТА МОДЕЛИ =====================

// Получить или создать анкету
async function getOrCreateApplication(chatId: number, userId: number, username?: string) {
  const { data: existing } = await supabase
    .from('telegram_model_applications')
    .select('*')
    .eq('chat_id', chatId)
    .eq('telegram_user_id', userId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (existing) {
    return existing;
  }
  
  const { data: newApp } = await supabase
    .from('telegram_model_applications')
    .insert({
      chat_id: chatId,
      telegram_user_id: userId,
      telegram_username: username,
      step: 'welcome',
      status: 'in_progress'
    })
    .select()
    .single();
  
  return newApp;
}

// Обновить анкету
async function updateApplication(id: string, updates: any) {
  await supabase
    .from('telegram_model_applications')
    .update(updates)
    .eq('id', id);
}

// Отправить приветствие анкеты
async function sendApplicationWelcome(chatId: number) {
  const settings = await getWelcomeSettings();
  
  if (settings.welcome_media_url) {
    switch (settings.welcome_media_type) {
      case 'video':
        await sendVideo(chatId, settings.welcome_media_url, settings.welcome_message);
        break;
      case 'animation':
        await sendAnimation(chatId, settings.welcome_media_url, settings.welcome_message);
        break;
      case 'photo':
        await sendPhoto(chatId, settings.welcome_media_url, settings.welcome_message);
        break;
      default:
        await sendVideo(chatId, settings.welcome_media_url, settings.welcome_message);
    }
  } else {
    await sendMessage(chatId, settings.welcome_message);
  }
  
  await sendMessageWithButtons(chatId, 
    '👇 <b>Нажмите кнопку ниже, чтобы начать заполнение анкеты:</b>', 
    [[{ text: '📝 Заполнить анкету', callback_data: 'app_start' }]]
  );
}

// Отправить следующий вопрос анкеты
async function sendApplicationQuestion(chatId: number, step: string, application: any) {
  console.log('Sending application question for step:', step);
  
  switch (step) {
    case 'full_name':
      await sendMessage(chatId, '👤 <b>Шаг 1/15</b>\n\nКак вас зовут? Напишите ваше <b>полное имя</b>:');
      break;
      
    case 'age':
      await sendMessage(chatId, '🎂 <b>Шаг 2/15</b>\n\nСколько вам <b>полных лет</b>? (только число)');
      break;
      
    case 'country':
      await sendMessageWithButtons(chatId,
        '🌍 <b>Шаг 3/15</b>\n\nВыберите вашу <b>страну проживания</b>:',
        [
          [{ text: '🇷🇺 Россия', callback_data: 'app_country_russia' }, { text: '🇺🇦 Украина', callback_data: 'app_country_ukraine' }],
          [{ text: '🇧🇾 Беларусь', callback_data: 'app_country_belarus' }, { text: '🇰🇿 Казахстан', callback_data: 'app_country_kazakhstan' }],
          [{ text: '🇺🇿 Узбекистан', callback_data: 'app_country_uzbekistan' }, { text: '🇲🇩 Молдова', callback_data: 'app_country_moldova' }],
          [{ text: '🇵🇱 Польша', callback_data: 'app_country_poland' }, { text: '🇬🇪 Грузия', callback_data: 'app_country_georgia' }],
          [{ text: '🌐 Другая страна', callback_data: 'app_country_other' }]
        ]
      );
      break;
      
    case 'height_weight':
      await sendMessage(chatId, '📏 <b>Шаг 4/15</b>\n\nУкажите ваш <b>рост и вес</b>.\n\nПример: 170 см / 55 кг');
      break;
      
    case 'body_params':
      await sendMessage(chatId, '📐 <b>Шаг 5/15</b>\n\nУкажите ваши <b>параметры фигуры</b> (грудь-талия-бёдра).\n\nПример: 90-60-90');
      break;
      
    case 'hair_color':
      await sendMessageWithButtons(chatId,
        '💇 <b>Шаг 6/15</b>\n\nВыберите <b>цвет волос</b>:',
        [
          [{ text: '👱‍♀️ Блондинка', callback_data: 'app_hair_blonde' }, { text: '👩 Брюнетка', callback_data: 'app_hair_brunette' }],
          [{ text: '👩‍🦰 Рыжая', callback_data: 'app_hair_red' }, { text: '🧑‍🦳 Русая', callback_data: 'app_hair_light_brown' }],
          [{ text: '🎨 Цветные', callback_data: 'app_hair_colored' }]
        ]
      );
      break;
      
    case 'languages':
      await sendMessage(chatId, '🌐 <b>Шаг 7/15</b>\n\nКакими <b>языками</b> вы владеете?\n\nПример: Русский (родной), English (B2)');
      break;
      
    case 'platforms':
      await sendMessage(chatId, `🎯 <b>Шаг 8/15</b>

<b>Есть ли у вас уже платформы, где вы работаете?</b>

Напишите названия платформ, если есть. Например: OnlyFans, Fansly, Instagram и т.д.

Если платформ пока нет — напишите "нет" и мы подберём для вас лучшие варианты! 💎`);
      break;
      
    case 'content_types':
      const contentButtons = CONTENT_TYPES.map(c => [{ 
        text: `${application.content_preferences?.includes(c.id) ? '✅' : ''} ${c.emoji} ${c.name}`, 
        callback_data: `app_content_${c.id}` 
      }]);
      contentButtons.push([{ text: '✅ Готово', callback_data: 'app_content_done' }]);
      
      await sendMessageWithButtons(chatId,
        '🎭 <b>Шаг 9/15</b>\n\nКакой <b>контент</b> вы готовы создавать? (можно выбрать несколько):',
        contentButtons
      );
      break;
      
    case 'experience':
      await sendMessageWithButtons(chatId,
        '⭐ <b>Шаг 10/15</b>\n\nУ вас есть <b>опыт</b> работы моделью или в сфере контента?',
        [
          [{ text: '🆕 Нет опыта', callback_data: 'app_exp_none' }],
          [{ text: '📱 Есть соцсети', callback_data: 'app_exp_social' }],
          [{ text: '💰 Уже работаю моделью', callback_data: 'app_exp_model' }],
          [{ text: '🌟 Опытная модель', callback_data: 'app_exp_pro' }]
        ]
      );
      break;
      
    case 'social_links':
      await sendMessage(chatId, '📱 <b>Шаг 11/15</b>\n\nОтправьте ссылки на ваши <b>соцсети</b> (Instagram, TikTok, Twitter и т.д.).\n\nЕсли нет — напишите "нет"');
      break;
      
    case 'equipment':
      await sendMessageWithButtons(chatId,
        `📷 <b>Шаг 12/15</b>

<b>Какое оборудование у вас есть для работы?</b>

Выберите вариант ниже, а затем <b>уточните модель телефона или другого оборудования</b> в следующем сообщении:`,
        [
          [{ text: '📱 Только телефон', callback_data: 'app_equip_phone' }],
          [{ text: '💻 Телефон + ноутбук', callback_data: 'app_equip_laptop' }],
          [{ text: '📷 Проф. камера + свет', callback_data: 'app_equip_pro' }],
          [{ text: '🎬 Полная студия', callback_data: 'app_equip_studio' }]
        ]
      );
      break;
      
    case 'equipment_details':
      await sendMessage(chatId, `📱 <b>Уточните модель вашего оборудования:</b>

Напишите модель телефона (iPhone 15 Pro, Samsung S24 Ultra и т.д.) и другое оборудование, которое у вас есть (камера, свет, микрофон и т.д.)`);
      break;
      
    case 'time_availability':
      await sendMessageWithButtons(chatId,
        '⏰ <b>Шаг 13/15</b>\n\nСколько <b>времени</b> вы готовы уделять работе?',
        [
          [{ text: '🕐 2-3 часа/день', callback_data: 'app_time_part' }],
          [{ text: '🕓 4-6 часов/день', callback_data: 'app_time_half' }],
          [{ text: '🕗 8+ часов/день (Full-time)', callback_data: 'app_time_full' }],
          [{ text: '📅 Только по выходным', callback_data: 'app_time_weekend' }]
        ]
      );
      break;
      
    case 'desired_income':
      await sendMessageWithButtons(chatId,
        '💰 <b>Шаг 14/15</b>\n\nКакой <b>доход</b> вы хотите получать в месяц?',
        [
          [{ text: '💵 $1,000-3,000', callback_data: 'app_income_1k' }],
          [{ text: '💵💵 $3,000-5,000', callback_data: 'app_income_3k' }],
          [{ text: '💵💵💵 $5,000-10,000', callback_data: 'app_income_5k' }],
          [{ text: '💎 $10,000+', callback_data: 'app_income_10k' }]
        ]
      );
      break;
      
    case 'about_yourself':
      await sendMessage(chatId, `✨ <b>Шаг 15/15 — САМЫЙ ВАЖНЫЙ!</b>

🌟 <b>Расскажите о себе максимально подробно!</b>

Это ваш шанс показать себя с лучшей стороны. Мы раскрываем весь потенциал модели!

<b>Что важно рассказать:</b>
• Ваши хобби и увлечения
• Таланты (пение, танцы, игра на инструментах и т.д.)
• Интересные факты о себе
• Что вас мотивирует
• Ваши фишки и особенности

💡 <i>Например: если вы умеете петь, играть на гитаре, танцевать — это станет вашими сильными сторонами! Расскажите о своих уникальных качествах.</i>

Чем подробнее вы расскажете, тем лучше мы сможем вам помочь! 🚀`);
      break;
      
    case 'strong_points':
      await sendMessage(chatId, `💪 <b>Последний вопрос!</b>

В чём ваши <b>сильные стороны</b>? Чем вы можете выделиться среди других моделей?

<i>Опишите всё, что может стать вашим преимуществом!</i>`);
      break;
  }
}

// Завершить анкету
async function completeApplication(chatId: number, application: any) {
  const settings = await getWelcomeSettings();
  
  await updateApplication(application.id, {
    status: 'pending',
    completed_at: new Date().toISOString()
  });
  
  const summary = `
📋 <b>Ваша анкета успешно отправлена!</b>

👤 Имя: ${application.full_name || 'Не указано'}
🎂 Возраст: ${application.age || 'Не указан'}
🌍 Страна: ${application.country || 'Не указана'}
📏 Рост/вес: ${application.height || 'Не указано'} / ${application.weight || 'Не указан'}
💇 Волосы: ${application.hair_color || 'Не указано'}
🎯 Платформы: ${application.platforms?.join(', ') || 'Подберём для вас'}
💰 Желаемый доход: ${application.desired_income || 'Не указан'}

⏳ <b>Владелец агентства</b> рассмотрит вашу анкету и свяжется с вами в течение 24 часов!

📞 <b>Если вам не ответили или есть вопросы — пишите напрямую владельцу:</b> ${settings.owner_contact}
Он решит любой вопрос!
`;

  await sendMessage(chatId, summary);
  
  await sendMessageWithButtons(chatId,
    '🎉 <b>Спасибо за заполнение анкеты!</b>\n\nЧто бы вы хотели сделать дальше?',
    [
      [{ text: '📝 Заполнить заново', callback_data: 'app_restart' }],
      [{ text: '👤 Связаться с владельцем', url: `https://t.me/${settings.owner_contact.replace('@', '')}` }]
    ]
  );
}

// Обработка callback от кнопок анкеты
async function handleApplicationCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const username = callbackQuery.from.username;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;
  
  console.log('Application callback:', data);
  
  await answerCallbackQuery(callbackQuery.id);
  
  let application = await getOrCreateApplication(chatId, userId, username);
  
  if (data === 'app_start' || data === 'app_restart') {
    if (data === 'app_restart') {
      const { data: newApp } = await supabase
        .from('telegram_model_applications')
        .insert({
          chat_id: chatId,
          telegram_user_id: userId,
          telegram_username: username,
          step: 'full_name',
          status: 'in_progress'
        })
        .select()
        .single();
      application = newApp;
    } else {
      await updateApplication(application.id, { step: 'full_name' });
    }
    await sendApplicationQuestion(chatId, 'full_name', application);
    return;
  }
  
  // Обработка выбора страны
  if (data.startsWith('app_country_')) {
    const countryMap: Record<string, string> = {
      'app_country_russia': 'Россия',
      'app_country_ukraine': 'Украина',
      'app_country_belarus': 'Беларусь',
      'app_country_kazakhstan': 'Казахстан',
      'app_country_uzbekistan': 'Узбекистан',
      'app_country_moldova': 'Молдова',
      'app_country_poland': 'Польша',
      'app_country_georgia': 'Грузия',
      'app_country_other': 'Другая'
    };
    
    if (data === 'app_country_other') {
      await updateApplication(application.id, { step: 'country_input' });
      await sendMessage(chatId, '🌍 Напишите название вашей страны:');
    } else {
      await updateApplication(application.id, { 
        country: countryMap[data] || 'Не указана',
        step: 'height_weight' 
      });
      await sendApplicationQuestion(chatId, 'height_weight', application);
    }
    return;
  }
  
  // Обработка выбора цвета волос
  if (data.startsWith('app_hair_')) {
    const hairMap: Record<string, string> = {
      'app_hair_blonde': 'Блондинка',
      'app_hair_brunette': 'Брюнетка',
      'app_hair_red': 'Рыжая',
      'app_hair_light_brown': 'Русая',
      'app_hair_colored': 'Цветные'
    };
    
    await updateApplication(application.id, { 
      hair_color: hairMap[data] || 'Не указано',
      step: 'languages' 
    });
    await sendApplicationQuestion(chatId, 'languages', application);
    return;
  }
  
  // Обработка выбора типов контента
  if (data.startsWith('app_content_')) {
    if (data === 'app_content_done') {
      await updateApplication(application.id, { step: 'experience' });
      await sendApplicationQuestion(chatId, 'experience', application);
      return;
    }
    
    const contentId = data.replace('app_content_', '');
    const currentContent = application.content_preferences || [];
    
    let newContent;
    if (currentContent.includes(contentId)) {
      newContent = currentContent.filter((c: string) => c !== contentId);
    } else {
      newContent = [...currentContent, contentId];
    }
    
    await updateApplication(application.id, { content_preferences: newContent });
    application.content_preferences = newContent;
    
    const contentButtons = CONTENT_TYPES.map(c => [{ 
      text: `${newContent.includes(c.id) ? '✅' : ''} ${c.emoji} ${c.name}`, 
      callback_data: `app_content_${c.id}` 
    }]);
    contentButtons.push([{ text: '✅ Готово', callback_data: 'app_content_done' }]);
    
    await editMessage(chatId, messageId,
      '🎭 <b>Шаг 9/15</b>\n\nКакой <b>контент</b> вы готовы создавать? (можно выбрать несколько):',
      contentButtons
    );
    return;
  }
  
  // Обработка опыта
  if (data.startsWith('app_exp_')) {
    const expMap: Record<string, string[]> = {
      'app_exp_none': ['Нет опыта'],
      'app_exp_social': ['Есть соцсети'],
      'app_exp_model': ['Уже работаю моделью'],
      'app_exp_pro': ['Опытная модель']
    };
    
    await updateApplication(application.id, { 
      social_media_experience: expMap[data] || [],
      step: 'social_links' 
    });
    await sendApplicationQuestion(chatId, 'social_links', application);
    return;
  }
  
  // Обработка оборудования
  if (data.startsWith('app_equip_')) {
    const equipMap: Record<string, string> = {
      'app_equip_phone': 'Только телефон',
      'app_equip_laptop': 'Телефон + ноутбук',
      'app_equip_pro': 'Проф. камера + свет',
      'app_equip_studio': 'Полная студия'
    };
    
    await updateApplication(application.id, { 
      equipment: equipMap[data] || 'Не указано',
      step: 'equipment_details' 
    });
    await sendApplicationQuestion(chatId, 'equipment_details', application);
    return;
  }
  
  // Обработка времени
  if (data.startsWith('app_time_')) {
    const timeMap: Record<string, string> = {
      'app_time_part': '2-3 часа/день',
      'app_time_half': '4-6 часов/день',
      'app_time_full': '8+ часов/день',
      'app_time_weekend': 'Только по выходным'
    };
    
    await updateApplication(application.id, { 
      time_availability: timeMap[data] || 'Не указано',
      step: 'desired_income' 
    });
    await sendApplicationQuestion(chatId, 'desired_income', application);
    return;
  }
  
  // Обработка дохода
  if (data.startsWith('app_income_')) {
    const incomeMap: Record<string, string> = {
      'app_income_1k': '$1,000-3,000',
      'app_income_3k': '$3,000-5,000',
      'app_income_5k': '$5,000-10,000',
      'app_income_10k': '$10,000+'
    };
    
    await updateApplication(application.id, { 
      desired_income: incomeMap[data] || 'Не указано',
      step: 'about_yourself' 
    });
    await sendApplicationQuestion(chatId, 'about_yourself', application);
    return;
  }
}

// Обработка текстового ввода в анкете
async function handleApplicationTextInput(message: any): Promise<boolean> {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const username = message.from?.username;
  const text = message.text;
  
  const application = await getOrCreateApplication(chatId, userId, username);
  
  if (!application || application.status !== 'in_progress') {
    return false;
  }
  
  console.log('Processing text input for step:', application.step);
  
  switch (application.step) {
    case 'full_name':
      await updateApplication(application.id, { full_name: text, step: 'age' });
      await sendApplicationQuestion(chatId, 'age', application);
      return true;
      
    case 'age':
      const age = parseInt(text);
      if (isNaN(age) || age < 18 || age > 100) {
        await sendMessage(chatId, '⚠️ Пожалуйста, введите корректный возраст (от 18 лет). Только число:');
        return true;
      }
      await updateApplication(application.id, { age, step: 'country' });
      await sendApplicationQuestion(chatId, 'country', application);
      return true;
      
    case 'country_input':
      await updateApplication(application.id, { country: text, step: 'height_weight' });
      await sendApplicationQuestion(chatId, 'height_weight', application);
      return true;
      
    case 'height_weight':
      const parts = text.split('/').map((s: string) => s.trim());
      await updateApplication(application.id, { 
        height: parts[0] || text,
        weight: parts[1] || null,
        step: 'body_params' 
      });
      await sendApplicationQuestion(chatId, 'body_params', application);
      return true;
      
    case 'body_params':
      await updateApplication(application.id, { body_params: text, step: 'hair_color' });
      await sendApplicationQuestion(chatId, 'hair_color', application);
      return true;
      
    case 'languages':
      await updateApplication(application.id, { language_skills: text, step: 'platforms' });
      await sendApplicationQuestion(chatId, 'platforms', application);
      return true;
      
    case 'platforms':
      const platformsArray = text.toLowerCase() === 'нет' ? [] : [text];
      await updateApplication(application.id, { platforms: platformsArray, step: 'content_types' });
      await sendApplicationQuestion(chatId, 'content_types', application);
      return true;
      
    case 'social_links':
      await updateApplication(application.id, { social_media_links: text, step: 'equipment' });
      await sendApplicationQuestion(chatId, 'equipment', application);
      return true;
      
    case 'equipment_details':
      const currentEquipment = application.equipment || '';
      await updateApplication(application.id, { 
        equipment: `${currentEquipment} — ${text}`,
        step: 'time_availability' 
      });
      await sendApplicationQuestion(chatId, 'time_availability', application);
      return true;
      
    case 'about_yourself':
      await updateApplication(application.id, { about_yourself: text, step: 'strong_points' });
      await sendApplicationQuestion(chatId, 'strong_points', application);
      return true;
      
    case 'strong_points':
      await updateApplication(application.id, { strong_points: text, step: 'complete' });
      const updatedApp = await getOrCreateApplication(chatId, userId, username);
      await completeApplication(chatId, updatedApp);
      return true;
  }
  
  return false;
}

// Обработка команд
async function handleCommand(message: any) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const command = text.split(' ')[0].replace('@' + (message.via_bot?.username || ''), '');
  
  console.log('Model bot processing command:', command);
  
  switch (command) {
    case '/start':
    case '/apply':
      await sendApplicationWelcome(chatId);
      break;
      
    default:
      await sendMessage(chatId, `👋 <b>Привет!</b>

Я бот агентства <b>Apollo Production</b> для заполнения анкеты модели.

Используйте /start или /apply чтобы начать заполнение анкеты.`);
  }
}

// Обработка текстового сообщения
async function handleTextMessage(message: any) {
  const text = message.text;
  
  if (text.startsWith('/')) return;
  
  const isApplicationInput = await handleApplicationTextInput(message);
  if (!isApplicationInput) {
    await sendMessage(message.chat.id, '👆 Используйте /start чтобы начать заполнение анкеты.');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Model bot update:', JSON.stringify(update));
    
    const message = update.message || update.edited_message;
    const callbackQuery = update.callback_query;
    
    if (callbackQuery) {
      if (callbackQuery.data.startsWith('app_')) {
        await handleApplicationCallback(callbackQuery);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (message.text?.startsWith('/')) {
      await handleCommand(message);
    } else if (message.text) {
      await handleTextMessage(message);
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    console.error('Error processing update:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
