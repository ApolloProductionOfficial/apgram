import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { Calendar, Newspaper, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useButtonSound } from "@/hooks/useButtonSound";
import { Skeleton } from "@/components/ui/skeleton";
import ManualNewsFetch from "./ManualNewsFetch";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  published_at: string;
}

const NewsWidget = () => {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { playClickSound } = useButtonSound();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNews();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('news-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news'
        },
        (payload) => {
          console.log('New news item:', payload);
          setNews(prev => [payload.new as NewsItem, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [language]);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      // First, fetch fresh translated news from the edge function
      const { error: fetchError } = await supabase.functions.invoke('fetch-adult-news', {
        body: { language }
      });

      if (fetchError) {
        console.warn('Could not fetch fresh news:', fetchError);
      }

      // Then load news from database
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('language', language)
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      const errorTitle = language === 'ru' ? "Ошибка" : language === 'uk' ? "Помилка" : "Error";
      const errorDesc = language === 'ru' ? "Не удалось загрузить новости" : language === 'uk' ? "Не вдалося завантажити новини" : "Failed to load news";
      toast({
        title: errorTitle,
        description: errorDesc,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const newsTitle = language === 'ru' 
    ? "Новости адалт индустрии" 
    : language === 'uk' 
    ? "Новини адалт індустрії" 
    : "Adult Industry News";
  const loadingText = language === 'ru' ? "Загрузка новостей..." : language === 'uk' ? "Завантаження новин..." : "Loading news...";
  const noNewsText = language === 'ru' ? "Пока нет новостей" : language === 'uk' ? "Поки немає новин" : "No news yet";
 
  return (
    <aside 
      data-news-widget
      className="fixed right-0 top-[120px] bottom-0 w-80 bg-card/95 backdrop-blur-md border-l border-border overflow-y-auto p-6 hidden xl:block z-40"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
            <h3 className="text-lg font-semibold text-foreground leading-tight">{newsTitle}</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Обновляется автоматически 2 раза в день' : language === 'uk' ? 'Оновлюється автоматично 2 рази на день' : 'Auto-updates twice daily'}
            </p>
            <ManualNewsFetch />
          </div>
        </div>

        {/* News List */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">{noNewsText}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => {
              const NewsCard = item.url ? 'a' : 'div';
              const linkProps = item.url ? {
                href: item.url,
                target: "_blank",
                rel: "noopener noreferrer"
              } : {};
              
              return (
                <NewsCard
                  key={item.id}
                  {...linkProps}
                  className="relative bg-gradient-to-br from-card/80 via-card/60 to-card/80 border border-primary/20 rounded-xl p-5 hover:border-primary/50 transition-all duration-500 group cursor-pointer block no-underline overflow-hidden hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30"
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                >
                  {/* Cosmic glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                  
                  <div className="relative z-10">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 group-hover:text-primary/80 transition-colors">
                      <Calendar className="h-3 w-3 animate-pulse-glow" />
                      <span>{new Date(item.published_at).toLocaleDateString(language)}</span>
                      {item.source && (
                        <span className="ml-auto text-primary/70 font-semibold group-hover:text-primary transition-colors">{item.source}</span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors leading-snug drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      {item.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full" />
                </NewsCard>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        {!isLoading && news.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full group hover:bg-primary/10 hover:border-primary/50 transition-all"
              onClick={() => {
                playClickSound();
                navigate("/all-news");
              }}
            >
              <span className="mr-2">
                {language === 'ru' ? 'Все новости' : language === 'uk' ? 'Всі новини' : 'All News'}
              </span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default NewsWidget;
