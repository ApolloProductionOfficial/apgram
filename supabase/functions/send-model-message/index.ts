import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('MODEL_BOT_TOKEN');
    
    if (!botToken) {
      throw new Error('MODEL_BOT_TOKEN not configured');
    }

    const { chat_id, message, media_url, media_type, inline_keyboard } = await req.json();

    if (!chat_id) {
      throw new Error('chat_id is required');
    }

    console.log(`Sending to chat_id: ${chat_id}, media_type: ${media_type}, media_url: ${media_url}`);

    let response;
    let result;

    // If media is provided, send media with caption
    if (media_url && media_type) {
      let endpoint = 'sendPhoto';
      let mediaField = 'photo';
      
      if (media_type === 'video') {
        endpoint = 'sendVideo';
        mediaField = 'video';
      } else if (media_type === 'animation') {
        endpoint = 'sendAnimation';
        mediaField = 'animation';
      }

      console.log(`Using endpoint: ${endpoint}, field: ${mediaField}`);

      const body: any = {
        chat_id: chat_id,
        [mediaField]: media_url,
        caption: message || '',
        parse_mode: 'HTML',
      };

      if (inline_keyboard) {
        body.reply_markup = { inline_keyboard };
      }

      response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      result = await response.json();
      console.log('Telegram media response:', result);

      if (!result.ok) {
        throw new Error(result.description || 'Failed to send media');
      }
    } else if (message) {
      // Text only
      const body: any = {
        chat_id: chat_id,
        text: message,
        parse_mode: 'HTML',
      };

      if (inline_keyboard) {
        body.reply_markup = { inline_keyboard };
      }

      response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      result = await response.json();
      console.log('Telegram text response:', result);

      if (!result.ok) {
        throw new Error(result.description || 'Failed to send message');
      }
    } else {
      throw new Error('Either message or media_url is required');
    }

    return new Response(
      JSON.stringify({ success: true, message_id: result.result?.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});