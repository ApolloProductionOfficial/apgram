import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONLYMONSTER_API_KEY = Deno.env.get('ONLYMONSTER_API_KEY');
// OnlyMonster Beta API - попробуем несколько вариантов
const ONLYMONSTER_BASE_URLS = [
  'https://api.onlymonster.ai',
  'https://onlymonster.ai/api/v1',
  'https://app.onlymonster.ai/api/v1',
  'https://panel.onlymonster.ai/api/v1'
];

async function tryFetch(path: string, options: RequestInit): Promise<{response: Response | null, url: string}> {
  for (const baseUrl of ONLYMONSTER_BASE_URLS) {
    try {
      const fullUrl = `${baseUrl}${path}`;
      console.log(`Trying URL: ${fullUrl}`);
      const response = await fetch(fullUrl, options);
      console.log(`Response from ${fullUrl}: status ${response.status}`);
      if (response.status !== 503 && response.status !== 404) {
        return { response, url: fullUrl };
      }
    } catch (error) {
      console.log(`Failed for ${baseUrl}: ${error}`);
    }
  }
  return { response: null, url: '' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    console.log('OnlyMonster API action:', action, params);

    if (!ONLYMONSTER_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          connected: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      'Authorization': `Bearer ${ONLYMONSTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Api-Key': ONLYMONSTER_API_KEY,
    };

    switch (action) {
      case 'check_connection': {
        // Simple connection check - try multiple endpoints
        try {
          const { response, url } = await tryFetch('/creators', { headers });
          
          if (response && response.ok) {
            return new Response(
              JSON.stringify({ connected: true, url }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Also try /accounts endpoint
          const { response: accountsResponse, url: accountsUrl } = await tryFetch('/accounts', { headers });
          if (accountsResponse && accountsResponse.ok) {
            return new Response(
              JSON.stringify({ connected: true, url: accountsUrl }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ connected: false, message: 'All endpoints returned errors' }),
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

      case 'get_accounts': {
        try {
          // Try different endpoints
          const { response, url } = await tryFetch('/creators', { headers });
          
          if (response && response.ok) {
            const data = await response.json();
            console.log('OnlyMonster API data:', JSON.stringify(data).substring(0, 500));
            
            // Normalize the response - handle different response formats
            let accounts = [];
            if (Array.isArray(data)) {
              accounts = data;
            } else if (data.creators && Array.isArray(data.creators)) {
              accounts = data.creators;
            } else if (data.accounts && Array.isArray(data.accounts)) {
              accounts = data.accounts;
            } else if (data.data && Array.isArray(data.data)) {
              accounts = data.data;
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
              JSON.stringify({ accounts: normalizedAccounts, source_url: url }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Fallback - try /accounts endpoint
          const { response: accountsResponse } = await tryFetch('/accounts', { headers });
          if (accountsResponse && accountsResponse.ok) {
            const data = await accountsResponse.json();
            let accounts = Array.isArray(data) ? data : (data.accounts || data.data || []);
            const normalizedAccounts = accounts.map((acc: any, idx: number) => ({
              id: acc.id || acc._id || `acc_${idx}`,
              username: acc.username || acc.name || `account_${idx}`,
              display_name: acc.display_name || acc.displayName || acc.name || acc.username,
              subscribers: acc.subscribers || acc.fans_count || 0,
              earnings_today: acc.earnings_today || acc.todayEarnings || 0,
              earnings_month: acc.earnings_month || acc.monthEarnings || 0,
              messages_pending: acc.messages_pending || acc.pendingMessages || 0,
              last_sync: acc.last_sync || new Date().toISOString(),
              is_active: acc.is_active !== undefined ? acc.is_active : true
            }));
            
            return new Response(
              JSON.stringify({ accounts: normalizedAccounts }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ accounts: [], message: 'No working API endpoint found' }),
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
          const { response } = await tryFetch(`/creators/${account_id}/stats?period=${period || 'today'}`, { headers });

          if (response && response.ok) {
            const data = await response.json();
            return new Response(
              JSON.stringify(data),
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

      case 'get_earnings_history': {
        const { account_id, days = 14 } = params;
        
        try {
          // Try to get daily earnings from OnlyMonster API
          const { response } = await tryFetch(`/creators/${account_id}/earnings?days=${days}`, { headers });

          if (response && response.ok) {
            const data = await response.json();
            console.log('Earnings history from API:', data);
            return new Response(
              JSON.stringify({ earnings_history: data.earnings || data }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // If API doesn't support this endpoint yet, return empty
          console.log('Earnings history endpoint not available');
          return new Response(
            JSON.stringify({ earnings_history: [], message: 'Endpoint not available' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.log('Get earnings history failed:', error);
          return new Response(
            JSON.stringify({ earnings_history: [], error: String(error) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_messages': {
        const { account_id, limit = 50 } = params;
        
        try {
          const { response } = await tryFetch(`/creators/${account_id}/messages?limit=${limit}`, { headers });

          if (response && response.ok) {
            const data = await response.json();
            return new Response(
              JSON.stringify(data),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ messages: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.log('Get messages failed:', error);
          return new Response(
            JSON.stringify({ messages: [], error: String(error) }),
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
    console.error('OnlyMonster API error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
