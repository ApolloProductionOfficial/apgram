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

// Cache for questions
let questionsCache: any[] | null = null;
let questionsCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

// Fetch questions from database
async function getQuestions(): Promise<any[]> {
  const now = Date.now();
  if (questionsCache && (now - questionsCacheTime) < CACHE_TTL) {
    return questionsCache;
  }
  
  const { data } = await supabase
    .from('bot_questionnaire_questions')
    .select('*')
    .eq('is_active', true)
    .order('question_order', { ascending: true });
  
  questionsCache = data || [];
  questionsCacheTime = now;
  console.log('Loaded questions from DB:', questionsCache.length);
  return questionsCache;
}

// Get question by step
async function getQuestionByStep(step: string) {
  const questions = await getQuestions();
  return questions.find(q => q.step === step);
}

// Get next question step
async function getNextStep(currentStep: string): Promise<string | null> {
  const questions = await getQuestions();
  const currentIndex = questions.findIndex(q => q.step === currentStep);
  if (currentIndex === -1 || currentIndex >= questions.length - 1) {
    return null; // No more questions
  }
  return questions[currentIndex + 1].step;
}

// Get previous question step
async function getPreviousStep(currentStep: string): Promise<string | null> {
  const questions = await getQuestions();
  const currentIndex = questions.findIndex(q => q.step === currentStep);
  if (currentIndex <= 0) {
    return null; // No previous question
  }
  return questions[currentIndex - 1].step;
}

// Get total questions count
async function getTotalQuestions(): Promise<number> {
  const questions = await getQuestions();
  return questions.length;
}

// Get question number
async function getQuestionNumber(step: string): Promise<number> {
  const questions = await getQuestions();
  const index = questions.findIndex(q => q.step === step);
  return index + 1;
}

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
    owner_contact: '@Apollo_Production',
    owner_telegram_chat_id: null,
    notification_chat_ids: []
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
async function sendVideo(chatId: number, videoUrl: string, caption?: string, buttons?: any[][]) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendVideo`;
  
  const body: any = {
    chat_id: chatId,
    video: videoUrl,
    caption: caption,
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

// Отправка GIF/анимации
async function sendAnimation(chatId: number, animationUrl: string, caption?: string, buttons?: any[][]) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendAnimation`;
  
  const body: any = {
    chat_id: chatId,
    animation: animationUrl,
    caption: caption,
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

// Отправка фото
async function sendPhoto(chatId: number, photoUrl: string, caption?: string, buttons?: any[][]) {
  const url = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/sendPhoto`;
  
  const body: any = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
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

// Скачивание файла из Telegram
async function downloadTelegramFile(fileId: string): Promise<ArrayBuffer | null> {
  try {
    const fileInfoUrl = `https://api.telegram.org/bot${MODEL_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileInfoRes = await fetch(fileInfoUrl);
    const fileInfo = await fileInfoRes.json();
    
    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      console.error('Failed to get file info:', fileInfo);
      return null;
    }
    
    const fileUrl = `https://api.telegram.org/file/bot${MODEL_BOT_TOKEN}/${fileInfo.result.file_path}`;
    const fileRes = await fetch(fileUrl);
    
    if (!fileRes.ok) {
      console.error('Failed to download file');
      return null;
    }
    
    return await fileRes.arrayBuffer();
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

// Загрузка фото в Supabase Storage
async function uploadPhotoToStorage(fileId: string, applicationId: string, photoIndex: number): Promise<string | null> {
  try {
    const fileData = await downloadTelegramFile(fileId);
    if (!fileData) return null;
    
    const fileName = `${applicationId}_photo_${photoIndex}_${Date.now()}.jpg`;
    
    const { error } = await supabase.storage
      .from('model-applications')
      .upload(fileName, fileData, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('model-applications')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
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
  
  // Add button to the welcome message (inline with media)
  const welcomeButton = [[{ text: '📝 Заполнить анкету', callback_data: 'app_start' }]];
  
  if (settings.welcome_media_url) {
    switch (settings.welcome_media_type) {
      case 'video':
        await sendVideo(chatId, settings.welcome_media_url, settings.welcome_message, welcomeButton);
        break;
      case 'animation':
        await sendAnimation(chatId, settings.welcome_media_url, settings.welcome_message, welcomeButton);
        break;
      case 'photo':
        await sendPhoto(chatId, settings.welcome_media_url, settings.welcome_message, welcomeButton);
        break;
      default:
        await sendVideo(chatId, settings.welcome_media_url, settings.welcome_message, welcomeButton);
    }
  } else {
    // Send welcome text with button
    await sendMessageWithButtons(chatId, settings.welcome_message, welcomeButton);
  }
}

// Отправить вопрос анкеты (ДИНАМИЧЕСКИ ИЗ БД)
async function sendApplicationQuestion(chatId: number, step: string, application: any) {
  console.log('Sending application question for step:', step);
  
  const question = await getQuestionByStep(step);
  if (!question) {
    console.error('Question not found for step:', step);
    return;
  }
  
  const totalQuestions = await getTotalQuestions();
  const questionNum = await getQuestionNumber(step);
  const prevStep = await getPreviousStep(step);
  const header = `📋 <b>Шаг ${questionNum}/${totalQuestions}</b>\n\n`;
  const questionText = header + question.question + (question.description ? `\n\n<i>${question.description}</i>` : '');
  
  // Back button (only if not first question)
  const backButtonData = prevStep ? { text: '◀️ Назад', callback_data: `app_back_${prevStep}` } : null;
  
  switch (question.question_type) {
    case 'text':
      if (backButtonData) {
        await sendMessageWithButtons(chatId, questionText, [[backButtonData]]);
      } else {
        await sendMessage(chatId, questionText);
      }
      break;
      
    case 'buttons':
      // Parse options from question - arrange in pairs (2 per row)
      const options = question.options || [];
      const buttons: any[][] = [];
      
      for (let i = 0; i < options.length; i += 2) {
        const row = [];
        row.push({ text: options[i], callback_data: `app_${step}_${i}` });
        if (options[i + 1]) {
          row.push({ text: options[i + 1], callback_data: `app_${step}_${i + 1}` });
        }
        buttons.push(row);
      }
      
      // Add "Other" option for country (only if not already in options)
      if (step === 'country') {
        const hasOther = options.some((opt: string) => opt.toLowerCase().includes('друг'));
        if (!hasOther) {
          // Put "Другая страна" and back button in same row to make them smaller
          if (backButtonData) {
            buttons.push([
              { text: '🌐 Другая', callback_data: 'app_country_other' },
              backButtonData
            ]);
          } else {
            buttons.push([{ text: '🌐 Другая страна', callback_data: 'app_country_other' }]);
          }
        } else if (backButtonData) {
          buttons.push([backButtonData]);
        }
      } else {
        // Add back button for other button questions
        if (backButtonData) {
          buttons.push([backButtonData]);
        }
      }
      
      await sendMessageWithButtons(chatId, questionText, buttons);
      break;
      
    case 'multi_select':
      // Multi-select with checkboxes
      const multiOptions = question.options || [];
      const currentPrefs = application.content_preferences || [];
      
      // Paginate if more than 8 options
      const pageSize = 8;
      const totalPages = Math.ceil(multiOptions.length / pageSize);
      
      if (totalPages > 1) {
        // First page
        const page1Options = multiOptions.slice(0, pageSize);
        const multiButtons = page1Options.map((opt: any) => {
          const isSelected = currentPrefs.includes(opt.id);
          return [{ 
            text: `${isSelected ? '✅' : '⬜'} ${opt.emoji || ''} ${opt.name}`, 
            callback_data: `app_multi_${step}_${opt.id}` 
          }];
        });
        multiButtons.push([{ text: `➡️ Далее (стр. 2/${totalPages})`, callback_data: `app_multi_page_${step}_2` }]);
        multiButtons.push([{ text: '✅ Готово', callback_data: `app_multi_done_${step}` }]);
        if (backButtonData) multiButtons.push([backButtonData]);
        
        await sendMessageWithButtons(chatId, questionText + '\n\n<b>Страница 1/' + totalPages + '</b>', multiButtons);
      } else {
        const multiButtons = multiOptions.map((opt: any) => {
          const isSelected = currentPrefs.includes(opt.id);
          return [{ 
            text: `${isSelected ? '✅' : '⬜'} ${opt.emoji || ''} ${opt.name}`, 
            callback_data: `app_multi_${step}_${opt.id}` 
          }];
        });
        multiButtons.push([{ text: '✅ Готово', callback_data: `app_multi_done_${step}` }]);
        if (backButtonData) multiButtons.push([backButtonData]);
        
        await sendMessageWithButtons(chatId, questionText, multiButtons);
      }
      break;
      
    case 'photos':
      const photoButtons = [
        [{ text: '✅ Готово — у меня все фото', callback_data: 'app_photos_done' }],
        [{ text: '⏭️ Пропустить фото', callback_data: 'app_photos_skip' }]
      ];
      if (backButtonData) photoButtons.push([backButtonData]);
      
      await sendMessage(chatId, questionText + '\n\n📷 <b>Отправляйте фото по одному.</b> Когда закончите — нажмите кнопку ниже:');
      await sendMessageWithButtons(chatId, '👇 Отправьте фото или нажмите, когда закончите:', photoButtons);
      break;
      
    default:
      if (backButtonData) {
        await sendMessageWithButtons(chatId, questionText, [[backButtonData]]);
      } else {
        await sendMessage(chatId, questionText);
      }
  }
}

// Отправить уведомление владельцу о новой заявке
async function notifyOwner(application: any, settings: any) {
  const chatIds: number[] = [];
  
  if (settings.owner_telegram_chat_id) {
    chatIds.push(settings.owner_telegram_chat_id);
  }
  
  if (settings.notification_chat_ids && Array.isArray(settings.notification_chat_ids)) {
    chatIds.push(...settings.notification_chat_ids.filter((id: number) => id && !chatIds.includes(id)));
  }
  
  if (chatIds.length === 0) {
    console.log('No notification chat IDs set, skipping notification');
    return;
  }
  
  const ownerNotification = `
🆕 <b>НОВАЯ ЗАЯВКА МОДЕЛИ!</b>

👤 <b>Имя:</b> ${application.full_name || 'Не указано'}
🎂 <b>Возраст:</b> ${application.age || '?'}
🌍 <b>Страна:</b> ${application.country || 'Не указана'}
📏 <b>Параметры:</b> ${application.height || '?'} / ${application.weight || '?'}
💇 <b>Волосы:</b> ${application.hair_color || 'Не указано'}
📱 <b>Telegram:</b> @${application.telegram_username || 'unknown'}
💰 <b>Желаемый доход:</b> ${application.desired_income || 'Не указан'}

📸 <b>Фото:</b> ${application.portfolio_photos?.length || 0} шт.

📝 <b>О себе:</b>
${application.about_yourself ? application.about_yourself.substring(0, 500) + (application.about_yourself.length > 500 ? '...' : '') : 'Не указано'}

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
`;

  for (const chatId of chatIds) {
    try {
      await sendMessageWithButtons(chatId, ownerNotification, [
        [
          { text: '✅ Одобрить', callback_data: `admin_approve_${application.id}` },
          { text: '❌ Отклонить', callback_data: `admin_reject_${application.id}` }
        ],
        [{ text: '💬 Написать', url: `https://t.me/${application.telegram_username || ''}` }]
      ]);
      console.log(`Notification sent to ${chatId}`);
    } catch (error) {
      console.error(`Failed to send notification to ${chatId}:`, error);
    }
  }
}

// Завершить анкету
async function completeApplication(chatId: number, application: any) {
  const settings = await getWelcomeSettings();
  
  await updateApplication(application.id, {
    status: 'pending',
    completed_at: new Date().toISOString()
  });
  
  await notifyOwner(application, settings);
  
  await sendMessage(chatId, `✨ <b>Вы прекрасны!</b> ✨

Спасибо, что уделили время заполнению анкеты! 💜

Мы ценим каждую деталь, которую вы нам рассказали. Ваша уникальность — это именно то, что мы ищем!`);
  
  const summary = `
📋 <b>Ваша анкета успешно отправлена на проверку!</b>

👤 Имя: ${application.full_name || 'Не указано'}
🎂 Возраст: ${application.age || 'Не указан'}
🌍 Страна: ${application.country || 'Не указана'}
📏 Рост/вес: ${application.height || 'Не указано'} / ${application.weight || 'Не указан'}
💇 Волосы: ${application.hair_color || 'Не указано'}
💰 Желаемый доход: ${application.desired_income || 'Не указан'}
📸 Фото: ${application.portfolio_photos?.length || 0} шт.

📝 <b>Анкета отправлена на проверку!</b>
Мы уже изучаем вашу заявку и <b>скоро свяжемся с вами напрямую</b>!

📞 <b>Есть вопросы?</b> Пишите владельцу: @Apollo_Production
`;

  await sendMessage(chatId, summary);
  
  await sendMessageWithButtons(chatId,
    '🎉 <b>Спасибо за заполнение анкеты!</b>\n\nМы уже рассматриваем вашу заявку. Ожидайте — с вами скоро свяжутся! 💜',
    [
      [{ text: '💬 Связаться с владельцем', url: 'https://t.me/Apollo_Production' }]
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
  const questions = await getQuestions();
  
  // Start application
  if (data === 'app_start' || data === 'app_restart') {
    const firstQuestion = questions[0];
    if (!firstQuestion) {
      await sendMessage(chatId, '❌ Ошибка: вопросы анкеты не настроены.');
      return;
    }
    
    if (data === 'app_restart') {
      const { data: newApp } = await supabase
        .from('telegram_model_applications')
        .insert({
          chat_id: chatId,
          telegram_user_id: userId,
          telegram_username: username,
          step: firstQuestion.step,
          status: 'in_progress'
        })
        .select()
        .single();
      application = newApp;
    } else {
      await updateApplication(application.id, { step: firstQuestion.step });
    }
    await sendApplicationQuestion(chatId, firstQuestion.step, application);
    return;
  }
  
  // Handle back button (app_back_{step})
  const backMatch = data.match(/^app_back_(.+)$/);
  if (backMatch) {
    const targetStep = backMatch[1];
    await updateApplication(application.id, { step: targetStep });
    await sendApplicationQuestion(chatId, targetStep, application);
    return;
  }
  
  // Handle button selection for any step (app_{step}_{optionIndex})
  const buttonMatch = data.match(/^app_([^_]+)_(\d+)$/);
  if (buttonMatch) {
    const step = buttonMatch[1];
    const optionIndex = parseInt(buttonMatch[2]);
    
    const question = await getQuestionByStep(step);
    if (question && question.options) {
      const selectedOption = question.options[optionIndex];
      if (selectedOption) {
        // Clean option text (remove emoji prefix if present)
        const cleanOption = selectedOption.replace(/^[^\s]+\s/, '').trim();
        
        // Map step to field name
        const fieldMap: Record<string, string> = {
          'country': 'country',
          'hair_color': 'hair_color',
          'equipment': 'equipment',
          'time_availability': 'time_availability',
          'desired_income': 'desired_income'
        };
        
        const field = fieldMap[step] || step;
        const nextStep = await getNextStep(step);
        
        if (nextStep) {
          await updateApplication(application.id, { 
            [field]: cleanOption,
            step: nextStep 
          });
          await sendApplicationQuestion(chatId, nextStep, application);
        } else {
          // Last question - complete
          await updateApplication(application.id, { [field]: cleanOption, step: 'complete' });
          const updatedApp = await getOrCreateApplication(chatId, userId, username);
          await completeApplication(chatId, updatedApp);
        }
      }
    }
    return;
  }
  
  // Handle "Other" country input
  if (data === 'app_country_other') {
    await updateApplication(application.id, { step: 'country_input' });
    await sendMessage(chatId, '🌍 Напишите название вашей страны:');
    return;
  }
  
  // Handle multi-select toggles (app_multi_{step}_{optionId})
  const multiMatch = data.match(/^app_multi_([^_]+)_(.+)$/);
  if (multiMatch) {
    const step = multiMatch[1];
    const optionId = multiMatch[2];
    
    // Handle page navigation
    if (optionId.startsWith('page_')) {
      const pageMatch = optionId.match(/page_([^_]+)_(\d+)/);
      if (pageMatch) {
        const pageStep = pageMatch[1];
        const pageNum = parseInt(pageMatch[2]);
        
        const question = await getQuestionByStep(pageStep);
        if (question && question.options) {
          const pageSize = 8;
          const totalPages = Math.ceil(question.options.length / pageSize);
          const startIndex = (pageNum - 1) * pageSize;
          const pageOptions = question.options.slice(startIndex, startIndex + pageSize);
          const currentPrefs = application.content_preferences || [];
          
          const buttons = pageOptions.map((opt: any) => {
            const isSelected = currentPrefs.includes(opt.id);
            return [{ 
              text: `${isSelected ? '✅' : '⬜'} ${opt.emoji || ''} ${opt.name}`, 
              callback_data: `app_multi_${pageStep}_${opt.id}` 
            }];
          });
          
          // Navigation buttons
          const navButtons = [];
          if (pageNum > 1) {
            navButtons.push({ text: `⬅️ Стр. ${pageNum - 1}`, callback_data: `app_multi_page_${pageStep}_${pageNum - 1}` });
          }
          if (pageNum < totalPages) {
            navButtons.push({ text: `Стр. ${pageNum + 1} ➡️`, callback_data: `app_multi_page_${pageStep}_${pageNum + 1}` });
          }
          if (navButtons.length > 0) {
            buttons.push(navButtons);
          }
          buttons.push([{ text: '✅ Готово', callback_data: `app_multi_done_${pageStep}` }]);
          
          await editMessage(chatId, messageId, 
            `📋 ${question.question}\n\n<b>Страница ${pageNum}/${totalPages}</b>`,
            buttons
          );
        }
      }
      return;
    }
    
    // Handle "done" for multi-select
    if (optionId.startsWith('done_')) {
      const doneStep = optionId.replace('done_', '');
      const nextStep = await getNextStep(doneStep);
      
      if (nextStep) {
        await updateApplication(application.id, { step: nextStep });
        await sendApplicationQuestion(chatId, nextStep, application);
      } else {
        await updateApplication(application.id, { step: 'complete' });
        const updatedApp = await getOrCreateApplication(chatId, userId, username);
        await completeApplication(chatId, updatedApp);
      }
      return;
    }
    
    // Toggle option selection
    const currentPrefs = application.content_preferences || [];
    let newPrefs;
    if (currentPrefs.includes(optionId)) {
      newPrefs = currentPrefs.filter((c: string) => c !== optionId);
    } else {
      newPrefs = [...currentPrefs, optionId];
    }
    
    await updateApplication(application.id, { content_preferences: newPrefs });
    application.content_preferences = newPrefs;
    
    // Refresh the multi-select message
    const question = await getQuestionByStep(step);
    if (question && question.options) {
      const multiOptions = question.options;
      const pageSize = 8;
      
      // Find which page the option is on
      const optIndex = multiOptions.findIndex((o: any) => o.id === optionId);
      const currentPage = Math.floor(optIndex / pageSize) + 1;
      const totalPages = Math.ceil(multiOptions.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const pageOptions = multiOptions.slice(startIndex, startIndex + pageSize);
      
      const buttons = pageOptions.map((opt: any) => {
        const isSelected = newPrefs.includes(opt.id);
        return [{ 
          text: `${isSelected ? '✅' : '⬜'} ${opt.emoji || ''} ${opt.name}`, 
          callback_data: `app_multi_${step}_${opt.id}` 
        }];
      });
      
      // Navigation buttons
      const navButtons = [];
      if (currentPage > 1) {
        navButtons.push({ text: `⬅️ Стр. ${currentPage - 1}`, callback_data: `app_multi_page_${step}_${currentPage - 1}` });
      }
      if (currentPage < totalPages) {
        navButtons.push({ text: `Стр. ${currentPage + 1} ➡️`, callback_data: `app_multi_page_${step}_${currentPage + 1}` });
      }
      if (navButtons.length > 0) {
        buttons.push(navButtons);
      }
      buttons.push([{ text: '✅ Готово', callback_data: `app_multi_done_${step}` }]);
      
      const pageInfo = totalPages > 1 ? `\n\n<b>Страница ${currentPage}/${totalPages}</b>` : '';
      await editMessage(chatId, messageId, question.question + pageInfo, buttons);
    }
    return;
  }
  
  // Handle photos done/skip
  if (data === 'app_photos_done' || data === 'app_photos_skip') {
    const nextStep = await getNextStep('portfolio_photos');
    if (nextStep) {
      await updateApplication(application.id, { step: nextStep });
      await sendApplicationQuestion(chatId, nextStep, application);
    } else {
      await updateApplication(application.id, { step: 'complete' });
      const updatedApp = await getOrCreateApplication(chatId, userId, username);
      await completeApplication(chatId, updatedApp);
    }
    return;
  }
}

// Обработка фото сообщений
async function handlePhotoMessage(message: any): Promise<boolean> {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const username = message.from?.username;
  
  const application = await getOrCreateApplication(chatId, userId, username);
  
  if (!application || application.status !== 'in_progress' || application.step !== 'portfolio_photos') {
    return false;
  }
  
  const photos = message.photo;
  if (!photos || photos.length === 0) return false;
  
  const largestPhoto = photos[photos.length - 1];
  const currentPhotos = application.portfolio_photos || [];
  
  if (currentPhotos.length >= 10) {
    await sendMessage(chatId, '⚠️ Вы уже загрузили максимум 10 фото. Нажмите "Готово" чтобы продолжить.');
    return true;
  }
  
  await sendMessage(chatId, '⏳ Загружаю фото...');
  
  const photoUrl = await uploadPhotoToStorage(largestPhoto.file_id, application.id, currentPhotos.length + 1);
  
  if (photoUrl) {
    const newPhotos = [...currentPhotos, photoUrl];
    await updateApplication(application.id, { portfolio_photos: newPhotos });
    
    await sendMessageWithButtons(chatId, 
      `✅ Фото ${newPhotos.length} загружено!\n\nОтправьте ещё фото или нажмите "Готово":`,
      [[{ text: '✅ Готово — у меня все фото', callback_data: 'app_photos_done' }]]
    );
  } else {
    await sendMessage(chatId, '❌ Ошибка загрузки. Попробуйте ещё раз или пропустите этот шаг.');
  }
  
  return true;
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
  
  const currentStep = application.step;
  const question = await getQuestionByStep(currentStep);
  
  // Special handling for country_input
  if (currentStep === 'country_input') {
    const nextStep = await getNextStep('country');
    if (nextStep) {
      await updateApplication(application.id, { country: text, step: nextStep });
      await sendApplicationQuestion(chatId, nextStep, application);
    }
    return true;
  }
  
  // If current step expects text input
  if (question && question.question_type === 'text') {
    // Map step to field name
    const fieldMap: Record<string, string> = {
      'full_name': 'full_name',
      'age': 'age',
      'height_weight': 'height',
      'body_params': 'body_params',
      'languages': 'language_skills',
      'platforms': 'platforms',
      'social_links': 'social_media_links',
      'about_yourself': 'about_yourself'
    };
    
    const field = fieldMap[currentStep] || currentStep;
    let value: any = text;
    
    // Special handling for age
    if (currentStep === 'age') {
      const age = parseInt(text);
      if (isNaN(age) || age < 18 || age > 100) {
        await sendMessage(chatId, '⚠️ Пожалуйста, введите корректный возраст (от 18 лет). Только число:');
        return true;
      }
      value = age;
    }
    
    // Special handling for height_weight
    if (currentStep === 'height_weight') {
      const parts = text.split('/').map((s: string) => s.trim());
      await updateApplication(application.id, { 
        height: parts[0] || text,
        weight: parts[1] || null
      });
      const nextStep = await getNextStep(currentStep);
      if (nextStep) {
        await updateApplication(application.id, { step: nextStep });
        await sendApplicationQuestion(chatId, nextStep, application);
      }
      return true;
    }
    
    // Special handling for platforms
    if (currentStep === 'platforms') {
      value = text.toLowerCase() === 'нет' ? [] : [text];
    }
    
    const nextStep = await getNextStep(currentStep);
    
    if (nextStep) {
      await updateApplication(application.id, { [field]: value, step: nextStep });
      await sendApplicationQuestion(chatId, nextStep, application);
    } else {
      // Last question - complete
      await updateApplication(application.id, { [field]: value, step: 'complete' });
      const updatedApp = await getOrCreateApplication(chatId, userId, username);
      await completeApplication(chatId, updatedApp);
    }
    
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

Используйте /start или /apply чтобы начать заполнение анкеты.

📞 <b>Есть вопросы?</b> Пишите: @Apollo_Production`);
  }
}

// Обработка текстового сообщения
async function handleTextMessage(message: any) {
  const text = message.text;
  
  if (text.startsWith('/')) return;
  
  const isApplicationInput = await handleApplicationTextInput(message);
  if (!isApplicationInput) {
    await sendMessage(message.chat.id, '👆 Используйте /start чтобы начать заполнение анкеты.\n\n📞 Вопросы? Пишите: @Apollo_Production');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ 
      ok: true, 
      bot: 'Model Bot',
      status: 'running',
      version: '3.0.0 - Dynamic Questions'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return new Response(JSON.stringify({ ok: true, message: 'No body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const text = await req.text();
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ ok: true, message: 'Empty body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let update;
    try {
      update = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Body:', text.substring(0, 100));
      return new Response(JSON.stringify({ ok: true, message: 'Invalid JSON' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Model bot update:', JSON.stringify(update));
    
    const message = update.message || update.edited_message;
    const callbackQuery = update.callback_query;
    
    if (callbackQuery) {
      if (callbackQuery.data.startsWith('app_') || callbackQuery.data.startsWith('admin_')) {
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
    
    if (message.photo) {
      const handled = await handlePhotoMessage(message);
      if (handled) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
