import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromotionalAd {
  title: {
    ru: string;
    en: string;
    uk: string;
  };
  description: {
    ru: string;
    en: string;
    uk: string;
  };
  url: string;
}

const promotionalAds: PromotionalAd[] = [
  {
    title: {
      ru: '🔥 Партнёрская программа Apollo Production - 40% пассивного дохода',
      en: '🔥 Apollo Production Partnership Program - 40% Passive Income',
      uk: '🔥 Партнерська програма Apollo Production - 40% пасивного доходу'
    },
    description: {
      ru: 'Присоединяйтесь к нашей партнёрской программе и получайте 40% от дохода моделей, которых вы приведете! Стабильный пассивный доход без активных продаж. Полная поддержка и прозрачная статистика.',
      en: 'Join our partnership program and earn 40% from the revenue of models you refer! Stable passive income without active sales. Full support and transparent statistics.',
      uk: 'Приєднуйтесь до нашої партнерської програми та отримуйте 40% від доходу моделей, яких ви приведете! Стабільний пасивний дохід без активних продажів. Повна підтримка та прозора статистика.'
    },
    url: '/partnership-program'
  },
  {
    title: {
      ru: '💰 Разблокировка вывода криптовалюты для Fansly и OnlyFans',
      en: '💰 Crypto Withdrawal Unlock for Fansly and OnlyFans',
      uk: '💰 Розблокування виведення криптовалюти для Fansly та OnlyFans'
    },
    description: {
      ru: 'Не можете вывести средства в крипту? Мы поможем разблокировать вывод на Fansly и OnlyFans! Быстрое решение проблем с выплатами. Безопасно и конфиденциально. Свяжитесь с нами: @Apollo_Production',
      en: 'Cannot withdraw funds to crypto? We will help unlock withdrawals on Fansly and OnlyFans! Fast solution for payment issues. Safe and confidential. Contact us: @Apollo_Production',
      uk: 'Не можете вивести кошти в крипту? Ми допоможемо розблокувати виведення на Fansly та OnlyFans! Швидке вирішення проблем з виплатами. Безпечно та конфіденційно. Зв\'яжіться з нами: @Apollo_Production'
    },
    url: '/crypto-unlock'
  },
  {
    title: {
      ru: '✅ Верификация OnlyFans для РФ и СНГ (даже с FACEBAN)',
      en: '✅ OnlyFans Verification for Russia and CIS (even with FACEBAN)',
      uk: '✅ Верифікація OnlyFans для РФ та СНД (навіть з FACEBAN)'
    },
    description: {
      ru: 'Профессиональная верификация OnlyFans для моделей из России и СНГ. Работаем даже с FACEBAN! 100% успешных верификаций. Полное сопровождение процесса. Свяжитесь: @Apollo_Production',
      en: 'Professional OnlyFans verification for models from Russia and CIS. We work even with FACEBAN! 100% successful verifications. Full process support. Contact: @Apollo_Production',
      uk: 'Професійна верифікація OnlyFans для моделей з Росії та СНД. Працюємо навіть з FACEBAN! 100% успішних верифікацій. Повний супровід процесу. Зв\'яжіться: @Apollo_Production'
    },
    url: '/model-verification'
  },
  {
    title: {
      ru: '🌴 Резидентство в Дубае для моделей - новые возможности',
      en: '🌴 Dubai Residency for Models - New Opportunities',
      uk: '🌴 Резидентство в Дубаї для моделей - нові можливості'
    },
    description: {
      ru: 'Получите резидентство в Дубае и откройте новые возможности для работы! Легальный статус, безопасность, комфортные условия. Полное сопровождение документов. Узнайте больше: @Apollo_Production',
      en: 'Get Dubai residency and unlock new work opportunities! Legal status, security, comfortable conditions. Full document support. Learn more: @Apollo_Production',
      uk: 'Отримайте резидентство в Дубаї та відкрийте нові можливості для роботи! Легальний статус, безпека, комфортні умови. Повний супровід документів. Дізнайтеся більше: @Apollo_Production'
    },
    url: '/dubai-residency'
  },
  {
    title: {
      ru: '🎯 Рекрутинг моделей на 12+ платформ - начните зарабатывать больше',
      en: '🎯 Model Recruitment to 12+ Platforms - Start Earning More',
      uk: '🎯 Рекрутинг моделей на 12+ платформ - почніть заробляти більше'
    },
    description: {
      ru: 'Apollo Production набирает моделей для работы на OnlyFans, Fansly, LoyalFans, ManyVids, 4based и других платформах. До 40% от заработка, еженедельные выплаты, полная поддержка 24/7. Начните карьеру с профессионалами!',
      en: 'Apollo Production is recruiting models for OnlyFans, Fansly, LoyalFans, ManyVids, 4based and other platforms. Up to 40% of earnings, weekly payouts, full 24/7 support. Start your career with professionals!',
      uk: 'Apollo Production набирає моделей для роботи на OnlyFans, Fansly, LoyalFans, ManyVids, 4based та інших платформах. До 40% від заробітку, щотижневі виплати, повна підтримка 24/7. Почніть кар\'єру з професіоналами!'
    },
    url: '/model-recruitment'
  },
  {
    title: {
      ru: '📹 Веб-кам услуги - профессиональное управление и максимальный доход',
      en: '📹 Webcam Services - Professional Management and Maximum Income',
      uk: '📹 Веб-кам послуги - професійне управління та максимальний дохід'
    },
    description: {
      ru: 'Предлагаем полное управление веб-кам моделями: техническая поддержка, маркетинг, продвижение. Работа на топовых платформах. Увеличьте свой доход в 3-5 раз! Контакт: @Apollo_Production',
      en: 'We offer full webcam model management: technical support, marketing, promotion. Work on top platforms. Increase your income 3-5 times! Contact: @Apollo_Production',
      uk: 'Пропонуємо повне управління веб-кам моделями: технічна підтримка, маркетинг, просування. Робота на топових платформах. Збільште свій дохід у 3-5 разів! Контакт: @Apollo_Production'
    },
    url: '/webcam-services'
  }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting promotional ads posting...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Select random ad from the collection
    const randomAd = promotionalAds[Math.floor(Math.random() * promotionalAds.length)];
    console.log('Selected promotional ad:', randomAd.title.ru);

    // Post ad in all three languages
    const languages = ['ru', 'en', 'uk'] as const;
    const insertPromises = languages.map(async (lang) => {
      const newsItem = {
        title: randomAd.title[lang],
        description: randomAd.description[lang],
        source: 'Apollo Production',
        url: randomAd.url,
        language: lang,
        published_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('news')
        .insert(newsItem)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting ad in ${lang}:`, error);
        throw error;
      }

      console.log(`Successfully posted promotional ad in ${lang}`);
      return data;
    });

    const results = await Promise.all(insertPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Promotional ads posted successfully',
        count: results.length,
        ads: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in post-promotional-ads function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
