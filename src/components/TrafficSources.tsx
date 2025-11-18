import { Card, CardContent } from "@/components/ui/card";

const TrafficSources = () => {
  const sources = [
    {
      title: "TikTok (фермы)",
      description: "UGC‑сетки, Spark Ads, системный тест креативов и вертикалей."
    },
    {
      title: "Instagram (моб. фермы)",
      description: "Мобильные фермы, рилсы, прогрев, автоворонки и безопасные сетапы."
    },
    {
      title: "X (Twitter)",
      description: "NSFW‑friendly: треды, медиа, рост аудитории и прогрев."
    },
    {
      title: "Telegram",
      description: "Лиды в чат, быстрые продажи, SFS и рекламные сетки."
    },
    {
      title: "Dating (Tinder и др.)",
      description: "Дейтинговые конверсии в офферы и тёплые диалоги с высокой монетизацией."
    },
    {
      title: "PPC",
      description: "Google/Meta (где возможно), pre‑landing, ретаргет и атрибуция."
    },
    {
      title: "Microsites / SEO",
      description: "Прокладки, индексация, трафик из поиска и контент‑кластеры."
    },
    {
      title: "Influencers / Collabs",
      description: "Коллаборации, взаимные прогревы и перекрёстный трафик."
    },
    {
      title: "Reddit",
      description: "Вся информация перенесена — переходите на onlyreddit.com."
    }
  ];

  return (
    <section id="traffic" className="py-20 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Источники трафика
          </h2>
          <a 
            href="/#/telegram" 
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Подробнее →
          </a>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source, index) => (
            <Card 
              key={index}
              className="bg-card border-border hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">
                  {source.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {source.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrafficSources;
