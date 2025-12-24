import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OnlyFans API (app.onlyfansapi.com)
const ONLYFANS_API_KEY = Deno.env.get('ONLYFANS_API_KEY');
const ONLYFANS_BASE_URL = 'https://app.onlyfansapi.com/api';

async function fetchWithAuth(path: string): Promise<{response: Response | null, body: any}> {
  const fullUrl = `${ONLYFANS_BASE_URL}${path}`;
  console.log(`Fetching: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ONLYFANS_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const body = await response.json();
      return { response, body };
    }
    
    const errorText = await response.text();
    console.log(`Error response: ${errorText}`);
    return { response, body: null };
  } catch (error) {
    console.log(`Fetch error: ${error}`);
    return { response: null, body: null };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    console.log('OnlyFans API action:', action, params);

    if (!ONLYFANS_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          connected: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'check_connection': {
        try {
          // Test connection with profiles endpoint
          const { response, body } = await fetchWithAuth('/profiles/test');
          
          if (response && response.ok) {
            return new Response(
              JSON.stringify({ connected: true, data: body }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Even if endpoint doesn't exist, if we get 401/403 it means API is reachable
          if (response && (response.status === 401 || response.status === 403)) {
            return new Response(
              JSON.stringify({ connected: false, message: 'Invalid API key' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ connected: false, message: 'API not reachable' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.log('Connection check failed:', error);
          return new Response(
            JSON.stringify({ connected: false, error: String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_profile': {
        const { username } = params;
        
        if (!username) {
          return new Response(
            JSON.stringify({ error: 'Username required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          const { response, body } = await fetchWithAuth(`/profiles/${username}`);
          
          if (response && response.ok && body) {
            console.log('OnlyFans profile data:', JSON.stringify(body).substring(0, 500));
            return new Response(
              JSON.stringify({ profile: body }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ profile: null, message: 'Profile not found or API error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.log('Get profile failed:', error);
          return new Response(
            JSON.stringify({ profile: null, error: String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_accounts': {
        try {
          // OnlyFans API may have different endpoint structure
          // Try to get accounts list
          const { response, body } = await fetchWithAuth('/accounts');
          
          if (response && response.ok && body) {
            console.log('OnlyFans API data:', JSON.stringify(body).substring(0, 500));
            
            // Normalize the response
            let accounts = [];
            if (Array.isArray(body)) {
              accounts = body;
            } else if (body.accounts && Array.isArray(body.accounts)) {
              accounts = body.accounts;
            } else if (body.data && Array.isArray(body.data)) {
              accounts = body.data;
            }
            
            // Map to our format
            const normalizedAccounts = accounts.map((acc: any, idx: number) => ({
              id: acc.id || acc._id || `acc_${idx}`,
              username: acc.username || acc.name || acc.user_name || `account_${idx}`,
              display_name: acc.display_name || acc.displayName || acc.name || acc.username,
              subscribers: acc.subscribers || acc.fans_count || acc.subscribersCount || 0,
              earnings_today: acc.earnings_today || acc.todayEarnings || acc.today_earnings || 0,
              earnings_month: acc.earnings_month || acc.monthEarnings || acc.month_earnings || acc.total_earnings || 0,
              messages_pending: acc.messages_pending || acc.pendingMessages || acc.unread_messages || 0,
              last_sync: acc.last_sync || acc.lastSync || new Date().toISOString(),
              is_active: acc.is_active !== undefined ? acc.is_active : (acc.status === 'active' || acc.active || true)
            }));
            
            return new Response(
              JSON.stringify({ accounts: normalizedAccounts }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ accounts: [], message: 'API error or no data' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.log('Get accounts failed:', error);
          return new Response(
            JSON.stringify({ accounts: [], error: String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_stats': {
        const { account_id, period } = params;
        
        try {
          const { response, body } = await fetchWithAuth(`/accounts/${account_id}/stats?period=${period || 'today'}`);

          if (response && response.ok) {
            return new Response(
              JSON.stringify(body),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ stats: null }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.log('Get stats failed:', error);
          return new Response(
            JSON.stringify({ stats: null, error: String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('OnlyFans API error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
