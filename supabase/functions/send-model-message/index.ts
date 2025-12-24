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

    const { chat_id, message } = await req.json();

    if (!chat_id || !message) {
      throw new Error('chat_id and message are required');
    }

    console.log(`Sending message to chat_id: ${chat_id}`);

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    console.log('Telegram response:', result);

    if (!result.ok) {
      throw new Error(result.description || 'Failed to send message');
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