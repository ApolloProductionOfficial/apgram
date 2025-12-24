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
      // Multi-select with checkboxes - ALL options in 2 columns, no pagination
      // Map step to database field
      const multiFieldMap: Record<string, string> = {
        'content_preferences': 'content_preferences',
        'tabu': 'tabu_preferences'
      };
      const multiField = multiFieldMap[step] || 'content_preferences';
      const multiOptions = question.options || [];
      const currentPrefs = (application as any)[multiField] || [];
      
      // Build buttons in 2 columns
      const multiButtons: any[][] = [];
      for (let i = 0; i < multiOptions.length; i += 2) {
        const row = [];
        const opt1 = multiOptions[i];
        const isSelected1 = currentPrefs.includes(opt1.id);
        row.push({ 
          text: `${isSelected1 ? '✅' : '⬜'} ${opt1.emoji || ''} ${opt1.name}`.substring(0, 32), 
          callback_data: `app_ms_${step}_${opt1.id}` 
        });
        
        if (multiOptions[i + 1]) {
          const opt2 = multiOptions[i + 1];
          const isSelected2 = currentPrefs.includes(opt2.id);
          row.push({ 
            text: `${isSelected2 ? '✅' : '⬜'} ${opt2.emoji || ''} ${opt2.name}`.substring(0, 32), 
            callback_data: `app_ms_${step}_${opt2.id}` 
          });
        }
        multiButtons.push(row);
      }
      
      multiButtons.push([{ text: '✅ Готово', callback_data: `app_ms_done_${step}` }]);
      if (backButtonData) multiButtons.push([backButtonData]);
      
      await sendMessageWithButtons(chatId, questionText, multiButtons);
      break;
      
    case 'photos':
      // No skip button - require minimum 5 photos
      const currentPhotoCount = application.portfolio_photos?.length || 0;
      const minPhotos = 5;
      const photoButtons: any[][] = [];
      
      if (currentPhotoCount >= minPhotos) {
        photoButtons.push([{ text: `✅ Готово (${currentPhotoCount} фото)`, callback_data: 'app_photos_done' }]);
      }
      if (backButtonData) photoButtons.push([backButtonData]);
      
      const remainingPhotos = minPhotos - currentPhotoCount;
      const photoText = remainingPhotos > 0 
        ? `📷 <b>Обязательно загрузите минимум ${minPhotos} фото!</b>\nОсталось: ${remainingPhotos} фото\n\nОтправляйте по одному.`
        : `📷 Загружено ${currentPhotoCount} фото. Можете отправить ещё (максимум 10) или нажать "Готово".`;
      
      await sendMessage(chatId, questionText + '\n\n' + photoText);
      if (photoButtons.length > 0) {
        await sendMessageWithButtons(chatId, '👇 Управление:', photoButtons);
      }
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
  
  // Continue application from current step
  if (data === 'app_continue') {
    const currentStep = application.step;
    if (currentStep && currentStep !== 'welcome' && currentStep !== 'complete') {
      await sendApplicationQuestion(chatId, currentStep, application);
    } else {
      // If no valid step, start from first question
      const firstQuestion = questions[0];
      if (firstQuestion) {
        await updateApplication(application.id, { step: firstQuestion.step });
        await sendApplicationQuestion(chatId, firstQuestion.step, application);
      }
    }
    return;
  }
  
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
  // Note: step can contain underscores (e.g., hair_color), so we match greedily up to the last _\d+
  const buttonMatch = data.match(/^app_(.+)_(\d+)$/);
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
  
  // Handle multi-select toggles (app_ms_{step}_{optionId}) - robust parsing when optionId contains underscores
  if (data.startsWith('app_ms_done_')) {
    const doneStep = data.substring('app_ms_done_'.length);
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

  if (data.startsWith('app_ms_')) {
    // Find which multi_select step this callback belongs to by matching known step prefixes
    const multiSteps = questions
      .filter((q: any) => q.question_type === 'multi_select')
      .map((q: any) => q.step);

    const matchedStep = multiSteps.find((s: string) => data.startsWith(`app_ms_${s}_`));
    if (!matchedStep) {
      console.warn('Unmatched multi-select callback:', data);
      return;
    }

    const optionId = data.substring(`app_ms_${matchedStep}_`.length);

    // Map step to database field
    const msFieldMap: Record<string, string> = {
      'tabu': 'tabu_preferences',
    };
    const dbField = msFieldMap[matchedStep] || 'content_preferences';

    // Toggle option selection
    const currentPrefs = (application as any)[dbField] || [];
    const newPrefs = currentPrefs.includes(optionId)
      ? currentPrefs.filter((c: string) => c !== optionId)
      : [...currentPrefs, optionId];

    await updateApplication(application.id, { [dbField]: newPrefs });
    (application as any)[dbField] = newPrefs;

    // Refresh the multi-select message
    const question = await getQuestionByStep(matchedStep);
    if (question && question.options) {
      const multiOptions = question.options;
      const prevStep = await getPreviousStep(matchedStep);
      const backBtn = prevStep ? { text: '◀️ Назад', callback_data: `app_back_${prevStep}` } : null;

      const buttons: any[][] = [];
      for (let i = 0; i < multiOptions.length; i += 2) {
        const row = [];
        const opt1 = multiOptions[i];
        const isSelected1 = newPrefs.includes(opt1.id);
        row.push({
          text: `${isSelected1 ? '✅' : '⬜'} ${opt1.emoji || ''} ${opt1.name}`.substring(0, 32),
          callback_data: `app_ms_${matchedStep}_${opt1.id}`,
        });

        if (multiOptions[i + 1]) {
          const opt2 = multiOptions[i + 1];
          const isSelected2 = newPrefs.includes(opt2.id);
          row.push({
            text: `${isSelected2 ? '✅' : '⬜'} ${opt2.emoji || ''} ${opt2.name}`.substring(0, 32),
            callback_data: `app_ms_${matchedStep}_${opt2.id}`,
          });
        }
        buttons.push(row);
      }

      buttons.push([{ text: '✅ Готово', callback_data: `app_ms_done_${matchedStep}` }]);
      if (backBtn) buttons.push([backBtn]);

      await editMessage(chatId, messageId, question.question, buttons);
    }
    return;
  }
  
  // Handle photos done (no skip allowed anymore)
  if (data === 'app_photos_done') {
    // Check if minimum photos are uploaded
    const currentPhotos = application.portfolio_photos || [];
    const minPhotos = 5;
    
    if (currentPhotos.length < minPhotos) {
      await answerCallbackQuery(callbackQuery.id, `❌ Нужно минимум ${minPhotos} фото! Загружено: ${currentPhotos.length}`);
      return;
    }
    
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
    
    const minPhotos = 5;
    const remaining = minPhotos - newPhotos.length;
    
    if (remaining > 0) {
      await sendMessage(chatId, `✅ Фото ${newPhotos.length} загружено!\n\n📷 Осталось загрузить: ${remaining} фото`);
    } else {
      await sendMessageWithButtons(chatId, 
        `✅ Фото ${newPhotos.length} загружено! (мин. ${minPhotos} ✓)\n\nМожете отправить ещё (макс. 10) или нажмите "Готово":`,
        [[{ text: `✅ Готово (${newPhotos.length} фото)`, callback_data: 'app_photos_done' }]]
      );
    }
  } else {
    await sendMessage(chatId, '❌ Ошибка загрузки. Попробуйте ещё раз.');
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
