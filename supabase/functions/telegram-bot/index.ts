import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Получение настроек чата
async function getChatSettings(chatId: number) {
  const { data } = await supabase
    .from('telegram_chat_settings')
    .select('*')
    .eq('chat_id', chatId)
    .single();
  
  return data || {
    translator_enabled: true,
    voice_enabled: true,
    quick_phrases_enabled: true,
    summary_enabled: true
  };
}

// Создание/обновление настроек чата
async function ensureChatSettings(chatId: number, chatTitle?: string) {
  const { data: existing } = await supabase
    .from('telegram_chat_settings')
    .select('id')
    .eq('chat_id', chatId)
    .single();
  
  if (!existing) {
    await supabase.from('telegram_chat_settings').insert({
      chat_id: chatId,
      chat_title: chatTitle,
      translator_enabled: true,
      voice_enabled: true,
      quick_phrases_enabled: true,
      summary_enabled: true
    });
  } else if (chatTitle) {
    await supabase.from('telegram_chat_settings')
      .update({ chat_title: chatTitle })
      .eq('chat_id', chatId);
  }
}

// Отправка сообщения в Telegram
async function sendMessage(chatId: number, text: string, replyToMessageId?: number, customEmojiId?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text,
    reply_to_message_id: replyToMessageId,
    parse_mode: 'HTML',
  };
  
  // Если есть кастомный эмодзи, добавляем его как entity
  if (customEmojiId) {
    body.text = `⭐ ${text}`;
    body.entities = [{
      type: 'custom_emoji',
      offset: 0,
      length: 1,
      custom_emoji_id: customEmojiId
    }];
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Отправка фото
async function sendPhoto(chatId: number, photoUrl: string, caption?: string, customEmojiId?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  const body: any = {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  };
  
  if (customEmojiId && caption) {
    body.caption = `⭐ ${caption}`;
    body.caption_entities = [{
      type: 'custom_emoji',
      offset: 0,
      length: 1,
      custom_emoji_id: customEmojiId
    }];
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Отправка видео
async function sendVideo(chatId: number, videoUrl: string, caption?: string, customEmojiId?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;
  
  const body: any = {
    chat_id: chatId,
    video: videoUrl,
    caption,
    parse_mode: 'HTML',
  };
  
  if (customEmojiId && caption) {
    body.caption = `⭐ ${caption}`;
    body.caption_entities = [{
      type: 'custom_emoji',
      offset: 0,
      length: 1,
      custom_emoji_id: customEmojiId
    }];
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Отправка GIF/анимации
async function sendAnimation(chatId: number, animationUrl: string, caption?: string, customEmojiId?: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`;
  
  const body: any = {
    chat_id: chatId,
    animation: animationUrl,
    caption,
    parse_mode: 'HTML',
  };
  
  if (customEmojiId && caption) {
    body.caption = `⭐ ${caption}`;
    body.caption_entities = [{
      type: 'custom_emoji',
      offset: 0,
      length: 1,
      custom_emoji_id: customEmojiId
    }];
  }
  
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Отправка голосового сообщения
async function sendVoice(chatId: number, audioBase64: string, replyToMessageId?: number) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVoice`;
  
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  formData.append('voice', new Blob([bytes], { type: 'audio/ogg' }), 'voice.ogg');
  if (replyToMessageId) {
    formData.append('reply_to_message_id', replyToMessageId.toString());
  }
  
  await fetch(url, {
    method: 'POST',
    body: formData,
  });
}

// Получение файла из Telegram
async function getFileUrl(fileId: string): Promise<string> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const response = await fetch(url);
  const data = await response.json();
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
}

// Перевод RU ↔ EN через Lovable AI
async function translateRuEn(text: string): Promise<{ translation: string; isRussian: boolean }> {
  const hasRussian = /[а-яё]/i.test(text);
  const targetLang = hasRussian ? 'English' : 'Russian';
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a translator. Translate the text to ${targetLang}. Return ONLY the translation, nothing else.`
        },
        { role: 'user', content: text }
      ],
    }),
  });

  const data = await response.json();
  const translation = data.choices?.[0]?.message?.content || text;
  
  return { translation: translation.trim(), isRussian: hasRussian };
}

// Транскрипция аудио через ElevenLabs
async function transcribeAudio(audioUrl: string): Promise<string> {
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();
  
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.ogg');
  formData.append('model_id', 'scribe_v1');
  
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: formData,
  });
  
  const data = await response.json();
  return data.text || '';
}

// Генерация голоса через ElevenLabs
async function textToSpeech(text: string, targetLang: string): Promise<string> {
  const voiceId = targetLang === 'Russian' ? 'onwK4e9ZLuTAKqWW03F9' : 'JBFqnCBsd6RMkjVDRZzb';
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    }),
  });
  
  const arrayBuffer = await response.arrayBuffer();
  
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Генерация саммари за период
async function generateSummary(chatId: number, hours: number = 24): Promise<string> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data: messages } = await supabase
    .from('telegram_chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  
  if (!messages || messages.length === 0) {
    return 'За последние сутки сообщений не было.';
  }
  
  const transcript = messages.map(m => {
    const text = m.transcription || m.text || '[медиа]';
    return `${m.username || 'Аноним'}: ${text}`;
  }).join('\n');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `Ты помощник, который делает выжимку из переписки.
Проанализируй диалог и создай краткий отчёт на русском языке:
1. Основные темы обсуждения
2. Ключевые решения и выводы
3. Важные договорённости (если есть)
4. Нерешённые вопросы (если есть)

Будь кратким, но информативным.`
        },
        { role: 'user', content: `Переписка за последние ${hours} часов:\n\n${transcript}` }
      ],
    }),
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Не удалось создать саммари.';
}

// Обработка команд
async function handleCommand(message: any) {
  const chatId = message.chat.id;
  const chatTitle = message.chat.title || message.chat.first_name;
  const text = message.text || '';
  const command = text.split(' ')[0].replace('@' + (message.via_bot?.username || ''), '');
  
  console.log('Processing command:', command);
  
  // Сохраняем/обновляем настройки чата
  await ensureChatSettings(chatId, chatTitle);
  
  // Получаем настройки чата
  const settings = await getChatSettings(chatId);
  
  switch (command) {
    case '/start':
      await sendMessage(chatId, `👋 Привет! Я бот-помощник с функциями:

• <b>Автоперевод</b> — RU ↔ EN автоматически
• <b>Голосовые</b> — транскрибирую и переведу аудио
• <b>/summary</b> — выжимка за последние сутки
• <b>/summary_all</b> — общий отчёт за всё время
• <b>/p_команда</b> — быстрые фразы

⚙️ Управление функциями доступно на панели управления.`);
      break;
      
    case '/summary':
      if (!settings.summary_enabled) {
        await sendMessage(chatId, '⚠️ Функция саммари отключена для этого чата.');
        return;
      }
      await sendMessage(chatId, '⏳ Генерирую саммари за последние 24 часа...');
      const dailySummary = await generateSummary(chatId, 24);
      await sendMessage(chatId, `📊 <b>Саммари за сутки:</b>\n\n${dailySummary}`);
      break;
      
    case '/summary_all':
      if (!settings.summary_enabled) {
        await sendMessage(chatId, '⚠️ Функция саммари отключена для этого чата.');
        return;
      }
      await sendMessage(chatId, '⏳ Анализирую всю историю чата...');
      const { data: allMessages } = await supabase
        .from('telegram_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(500);
      
      if (!allMessages || allMessages.length === 0) {
        await sendMessage(chatId, 'История чата пуста.');
        break;
      }
      
      const fullTranscript = allMessages.map(m => {
        const txt = m.transcription || m.text || '[медиа]';
        return `${m.username || 'Аноним'}: ${txt}`;
      }).join('\n');
      
      const allSummaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Проанализируй всю историю переписки и создай подробный отчёт на русском:
1. Общая тематика обсуждений
2. Ключевые участники и их роли
3. Основные решения и выводы за всё время
4. Важные договорённости
5. Открытые вопросы и задачи`
            },
            { role: 'user', content: `Полная история чата (${allMessages.length} сообщений):\n\n${fullTranscript}` }
          ],
        }),
      });
      
      const allSummaryData = await allSummaryResponse.json();
      await sendMessage(chatId, `📋 <b>Полный отчёт:</b>\n\n${allSummaryData.choices?.[0]?.message?.content || 'Ошибка'}`);
      break;
      
    case '/phrases':
      await sendMessage(chatId, `📝 Управление быстрыми фразами доступно через веб-интерфейс.

Используйте команды вида: /p_название`);
      break;
      
    default:
      // Проверяем, есть ли это быстрая фраза
      if (command.startsWith('/')) {
        if (!settings.quick_phrases_enabled) {
          console.log('Quick phrases disabled for chat:', chatId);
          return;
        }
        
        const phraseCommand = command.substring(1);
        console.log('Looking for quick phrase:', phraseCommand);
        
        const { data: phrases, error: phraseError } = await supabase
          .from('telegram_quick_phrases')
          .select('phrase, media_url, media_type, custom_emoji_id')
          .eq('command', phraseCommand)
          .limit(1);
        
        console.log('Phrase query result:', phrases, 'error:', phraseError);
        
        if (phrases && phrases.length > 0) {
          const phrase = phrases[0];
          
          // Если есть медиа - отправляем с подписью
          if (phrase.media_url) {
            switch (phrase.media_type) {
              case 'photo':
                await sendPhoto(chatId, phrase.media_url, phrase.phrase, phrase.custom_emoji_id);
                break;
              case 'video':
                await sendVideo(chatId, phrase.media_url, phrase.phrase, phrase.custom_emoji_id);
                break;
              case 'animation':
                await sendAnimation(chatId, phrase.media_url, phrase.phrase, phrase.custom_emoji_id);
                break;
              default:
                await sendMessage(chatId, phrase.phrase, undefined, phrase.custom_emoji_id);
            }
          } else {
            // Текст с возможным кастомным эмодзи
            await sendMessage(chatId, phrase.phrase, undefined, phrase.custom_emoji_id);
          }
        } else {
          console.log('No phrase found for command:', phraseCommand);
        }
      }
  }
}

// Обработка текстового сообщения
async function handleTextMessage(message: any) {
  const chatId = message.chat.id;
  const chatTitle = message.chat.title || message.chat.first_name;
  const text = message.text;
  const messageId = message.message_id;
  const username = message.from?.username || message.from?.first_name || 'Unknown';
  
  // Игнорируем команды
  if (text.startsWith('/')) return;
  
  // Сохраняем/обновляем настройки чата
  await ensureChatSettings(chatId, chatTitle);
  
  // Получаем настройки чата
  const settings = await getChatSettings(chatId);
  
  // Сохраняем сообщение
  await supabase.from('telegram_chat_messages').insert({
    chat_id: chatId,
    message_id: messageId,
    user_id: message.from?.id,
    username,
    text,
  });
  
  // Если переводчик выключен - не переводим
  if (!settings.translator_enabled) {
    console.log('Translator disabled for chat:', chatId);
    return;
  }
  
  // Переводим
  const { translation, isRussian } = await translateRuEn(text);
  
  // Обновляем с переводом
  await supabase.from('telegram_chat_messages')
    .update({ translation })
    .eq('chat_id', chatId)
    .eq('message_id', messageId);
  
  const fromLang = isRussian ? 'RU' : 'EN';
  const toLang = isRussian ? 'EN' : 'RU';
  await sendMessage(chatId, `🌐 <b>${fromLang} → ${toLang}</b>\n\n${translation}`, messageId);
}

// Обработка голосового сообщения
async function handleVoiceMessage(message: any) {
  const chatId = message.chat.id;
  const chatTitle = message.chat.title || message.chat.first_name;
  const messageId = message.message_id;
  const username = message.from?.username || message.from?.first_name || 'Unknown';
  const voice = message.voice || message.audio;
  
  if (!voice) return;
  
  // Сохраняем/обновляем настройки чата
  await ensureChatSettings(chatId, chatTitle);
  
  // Получаем настройки чата
  const settings = await getChatSettings(chatId);
  
  if (!settings.voice_enabled) {
    console.log('Voice processing disabled for chat:', chatId);
    return;
  }
  
  await sendMessage(chatId, '🎤 Транскрибирую аудио...', messageId);
  
  try {
    // Получаем URL файла
    const fileUrl = await getFileUrl(voice.file_id);
    
    // Транскрибируем
    const transcription = await transcribeAudio(fileUrl);
    
    if (!transcription) {
      await sendMessage(chatId, '❌ Не удалось распознать аудио', messageId);
      return;
    }
    
    // Сохраняем
    await supabase.from('telegram_chat_messages').insert({
      chat_id: chatId,
      message_id: messageId,
      user_id: message.from?.id,
      username,
      is_voice: true,
      transcription,
    });
    
    // Если переводчик включён - переводим
    if (settings.translator_enabled) {
      const { translation, isRussian } = await translateRuEn(transcription);
      
      // Обновляем
      await supabase.from('telegram_chat_messages')
        .update({ translation })
        .eq('chat_id', chatId)
        .eq('message_id', messageId);
      
      const fromLang = isRussian ? 'RU' : 'EN';
      const toLang = isRussian ? 'EN' : 'RU';
      
      // Отправляем текстовый перевод
      await sendMessage(chatId, `🎤 <b>Транскрипция (${fromLang}):</b>\n${transcription}\n\n🌐 <b>Перевод (${toLang}):</b>\n${translation}`, messageId);
      
      // Генерируем голосовой перевод
      const audioBase64 = await textToSpeech(translation, isRussian ? 'English' : 'Russian');
      await sendVoice(chatId, audioBase64, messageId);
    } else {
      // Только транскрипция без перевода
      await sendMessage(chatId, `🎤 <b>Транскрипция:</b>\n${transcription}`, messageId);
    }
    
  } catch (error) {
    console.error('Voice processing error:', error);
    await sendMessage(chatId, '❌ Ошибка обработки голосового сообщения', messageId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Telegram update:', JSON.stringify(update));
    
    const message = update.message || update.edited_message;
    
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Обработка в зависимости от типа сообщения
    if (message.text?.startsWith('/')) {
      await handleCommand(message);
    } else if (message.voice || message.audio) {
      await handleVoiceMessage(message);
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
