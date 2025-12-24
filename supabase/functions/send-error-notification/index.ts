import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is DISABLED - email notifications are not used
// Telegram notifications via model-bot are the primary notification method
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always return success - email notifications are disabled
  // Use Telegram notifications instead (via model-bot)
  console.log("Email notifications disabled - use Telegram instead");
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      skipped: true, 
      reason: "Email notifications disabled. Use Telegram notifications via model-bot." 
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
