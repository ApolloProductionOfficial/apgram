import { Card, CardContent } from "@/components/ui/card";
import { Music2, Instagram, Twitter, Send, Heart, DollarSign, Search, Users, MessageSquare } from "lucide-react";
import { useButtonSound } from "@/hooks/useButtonSound";

const TrafficSources = () => {
  const { playClickSound } = useButtonSound();
  
  const sources = [
    {
      icon: Music2,
      title: "TikTok (фермы)",
      description: "UGC‑сетки, Spark Ads, системный тест креативов и вертикалей.",
      gradient: "from-pink-500/20 to-purple-500/20"
    },
    {
      icon: Instagram,
      title: "Instagram (моб. фермы)",
      description: "Мобильные фермы, рилсы, прогрев, автоворонки и безопасные сетапы.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Twitter,
      title: "X (Twitter)",
      description: "NSFW‑friendly: треды, медиа, рост аудитории и прогрев.",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: Send,
      title: "Telegram",
      description: "Лиды в чат, быстрые продажи, SFS и рекламные сетки.",
      gradient: "from-blue-400/20 to-blue-600/20"
    },
    {
      icon: Heart,
      title: "Dating (Tinder и др.)",
      description: "Дейтинговые конверсии в офферы и тёплые диалоги с высокой монетизацией.",
      gradient: "from-red-500/20 to-pink-500/20"
    },
    {
      icon: DollarSign,
      title: "PPC",
      description: "Google/Meta (где возможно), pre‑landing, ретаргет и атрибуция.",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: Search,
      title: "Microsites / SEO",
      description: "Прокладки, индексация, трафик из поиска и контент‑кластеры.",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: Users,
      title: "Influencers / Collabs",
      description: "Коллаборации, взаимные прогревы и перекрёстный трафик.",
      gradient: "from-indigo-500/20 to-purple-500/20"
    },
    {
      icon: MessageSquare,
      title: "Reddit",
      description: "Вся информация перенесена — переходите на onlyreddit.com.",
      gradient: "from-orange-500/20 to-red-500/20"
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
          {sources.map((source, index) => {
            const Icon = source.icon;
            return (
              <Card 
                key={index}
                className="bg-card border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer overflow-hidden"
                onClick={playClickSound}
              >
                <CardContent className="p-6 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${source.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative">
                    <div className="mb-4 inline-flex p-3 rounded-lg bg-background/50 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">
                      {source.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {source.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrafficSources;
