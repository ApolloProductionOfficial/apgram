import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONLYMONSTER_API_KEY = Deno.env.get('ONLYMONSTER_API_KEY');
// OnlyMonster Beta API - use only the working endpoint
const ONLYMONSTER_BASE_URL = 'https://onlymonster.ai/api/v1';

async function tryFetch(path: string, authHeader: string): Promise<Response | null> {
  const fullUrl = `${ONLYMONSTER_BASE_URL}${path}`;
  console.log(`Trying URL: ${fullUrl} with auth: ${authHeader}`);
  
  try {
    const response = await fetch(fullUrl, {
      headers: {
        [authHeader]: ONLYMONSTER_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    console.log(`Response from ${fullUrl}: status ${response.status}`);
    return response;
  } catch (error) {
    console.log(`Failed for ${fullUrl}: ${error}`);
    return null;
  }
}

async function fetchWithAuth(path: string): Promise<{response: Response | null, body: any}> {
  // Try different auth methods
  const authMethods = [
    'X-API-Key',
    'Authorization',
    'X-Auth-Token',
    'Api-Key'
  ];
  
  for (const method of authMethods) {
    let response: Response | null = null;
    
    if (method === 'Authorization') {
      // For Authorization header, try both Bearer and plain token
      for (const prefix of ['Bearer ', '']) {
        const fullUrl = `${ONLYMONSTER_BASE_URL}${path}`;
        try {
          response = await fetch(fullUrl, {
            headers: {
              'Authorization': `${prefix}${ONLYMONSTER_API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            }
          });
          console.log(`Auth with "Authorization: ${prefix}..." status: ${response.status}`);
          if (response.ok) {
            const body = await response.json();
            return { response, body };
          }
        } catch (e) {
          console.log(`Failed with ${method}: ${e}`);
        }
      }
    } else {
      const fullUrl = `${ONLYMONSTER_BASE_URL}${path}`;
      try {
        response = await fetch(fullUrl, {
          headers: {
            [method]: ONLYMONSTER_API_KEY!,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });
        console.log(`Auth with "${method}": status ${response.status}`);
        if (response.ok) {
          const body = await response.json();
          return { response, body };
        }
      } catch (e) {
        console.log(`Failed with ${method}: ${e}`);
      }
    }
  }
  
  return { response: null, body: null };
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

    switch (action) {
      case 'check_connection': {
        // Try to connect using fetchWithAuth
        try {
          const { response, body } = await fetchWithAuth('/creators');
          
          if (response && response.ok) {
            return new Response(
              JSON.stringify({ connected: true, data: body }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ connected: false, message: 'Authentication failed - check API key format' }),
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
          const { response, body } = await fetchWithAuth('/creators');
          
          if (response && response.ok && body) {
            console.log('OnlyMonster API data:', JSON.stringify(body).substring(0, 500));
            
            // Normalize the response - handle different response formats
            let accounts = [];
            if (Array.isArray(body)) {
              accounts = body;
            } else if (body.creators && Array.isArray(body.creators)) {
              accounts = body.creators;
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
            JSON.stringify({ accounts: [], message: 'API authentication failed' }),
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
          const { response, body } = await fetchWithAuth(`/creators/${account_id}/stats?period=${period || 'today'}`);

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

      case 'get_earnings_history': {
        const { account_id, days = 14 } = params;
        
        try {
          const { response, body } = await fetchWithAuth(`/creators/${account_id}/earnings?days=${days}`);

          if (response && response.ok) {
            console.log('Earnings history from API:', body);
            return new Response(
              JSON.stringify({ earnings_history: body.earnings || body }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

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
          const { response, body } = await fetchWithAuth(`/creators/${account_id}/messages?limit=${limit}`);

          if (response && response.ok) {
            return new Response(
              JSON.stringify(body),
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
