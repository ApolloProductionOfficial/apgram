import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsItem {
  title: string;
  description: string;
  source: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting adult industry news fetch...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get language from request body
    const body = req.method === 'POST' ? await req.json() : {};
    const language = body.language || 'en';
    
    console.log('Fetching news for language:', language);

    // Search queries based on language - search on news sites, not OnlyFans
    const searchQueriesByLang: Record<string, string[]> = {
      ru: [
        'site:xbiz.com OR site:avn.com OR site:adultbusiness.com OnlyFans новости',
        'site:xbiz.com OR site:avn.com создатели контента новости',
        'site:adultbusiness.com OR site:xbiz.com индустрия контента',
        'site:avn.com OR site:xbiz.com платформы для создателей'
      ],
      en: [
        'site:xbiz.com OR site:avn.com OR site:adultbusiness.com OnlyFans news',
        'site:xbiz.com OR site:avn.com content creator news',
        'site:adultbusiness.com OR site:xbiz.com adult industry news',
        'site:avn.com OR site:xbiz.com creator platform updates'
      ],
      uk: [
        'site:xbiz.com OR site:avn.com OR site:adultbusiness.com OnlyFans новини',
        'site:xbiz.com OR site:avn.com творці контенту новини',
        'site:adultbusiness.com OR site:xbiz.com індустрія контенту',
        'site:avn.com OR site:xbiz.com платформи для творців'
      ]
    };

    const queries = searchQueriesByLang[language] || searchQueriesByLang.en;
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    console.log('Searching for:', randomQuery);

    // Using Brave Search API for real news
    const braveApiKey = Deno.env.get('BRAVE_API_KEY');
    if (!braveApiKey) {
      console.log('BRAVE_API_KEY not set, using fallback');
    }

    const newsResponse = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(randomQuery)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': braveApiKey || ''
      }
    });

    let newsItems: NewsItem[] = [];

    if (newsResponse.ok && braveApiKey) {
      const newsData = await newsResponse.json();
      console.log('Search results received');

      if (newsData.web && newsData.web.results && newsData.web.results.length > 0) {
        newsItems = newsData.web.results
          .filter((item: any) => item.url && !item.url.includes('onlyfans.com'))
          .slice(0, 2)
          .map((item: any) => ({
            title: item.title || 'Industry Update',
            description: item.description || 'New developments in the creator economy',
            source: new URL(item.url).hostname.replace('www.', ''),
            url: item.url
          }));
        console.log(`Found ${newsItems.length} news items`);
      }
    }

    // Fallback news if API fails or no results found
    if (newsItems.length === 0) {
      console.log('Using fallback news');
      const fallbackNewsByLang: Record<string, any[]> = {
        ru: [
          {
            title: 'Экономика создателей контента продолжает рост',
            description: 'Индустрия создателей контента показывает сильный рост с увеличением доходов на всех основных платформах. Эксперты отмечают растущий интерес к независимым платформам.',
            source: 'xbiz.com',
            url: 'https://xbiz.com'
          },
          {
            title: 'Новые тренды в индустрии контента для взрослых',
            description: 'Аналитики прогнозируют продолжение роста рынка платформ для создателей контента в ближайшие годы.',
            source: 'avn.com',
            url: 'https://avn.com'
          }
        ],
        en: [
          {
            title: 'Content Creator Economy Continues Growth',
            description: 'The creator economy shows strong momentum with increased earnings across major platforms. Industry experts note growing interest in independent platforms.',
            source: 'xbiz.com',
            url: 'https://xbiz.com'
          },
          {
            title: 'New Trends in Adult Content Industry',
            description: 'Analysts predict continued growth in the creator platform market over the coming years.',
            source: 'avn.com',
            url: 'https://avn.com'
          }
        ],
        uk: [
          {
            title: 'Економіка творців контенту продовжує зростання',
            description: 'Індустрія творців контенту показує сильне зростання зі збільшенням доходів на всіх основних платформах. Експерти відзначають зростаючий інтерес до незалежних платформ.',
            source: 'xbiz.com',
            url: 'https://xbiz.com'
          },
          {
            title: 'Нові тренди в індустрії контенту для дорослих',
            description: 'Аналітики прогнозують продовження зростання ринку платформ для творців контенту в найближчі роки.',
            source: 'avn.com',
            url: 'https://avn.com'
          }
        ]
      };
      const fallbackNews = fallbackNewsByLang[language] || fallbackNewsByLang.en;
      newsItems = [fallbackNews[Math.floor(Math.random() * fallbackNews.length)]];
    }

    // Save news to database
    const { data, error } = await supabase
      .from('news')
      .insert(newsItems.map(item => ({
        title: item.title,
        description: item.description,
        source: item.source,
        url: item.url,
        published_at: new Date().toISOString()
      })));

    if (error) {
      console.error('Error saving news:', error);
      throw error;
    }

    console.log(`Successfully saved ${newsItems.length} news items`);

    return new Response(JSON.stringify({ 
      success: true, 
      count: newsItems.length,
      items: newsItems
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to fetch news',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
