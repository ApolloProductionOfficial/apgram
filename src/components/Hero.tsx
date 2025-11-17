import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                5 лет на рынке
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Управляем ростом
              <span className="block text-primary mt-2">
                моделей на OnlyFans
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Помогали открывать агентства, собрали лучший опыт и ошибки — строим своё OnlyFans‑агентство полного цикла. 
              <span className="block mt-2">
                Вы — создаёте, мы — масштабируем.
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow group">
                Начать работу
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Анкета для моделей
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-card backdrop-blur-xl rounded-2xl p-8 border border-border shadow-glow">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Быстрые ссылки</h3>
                    <div className="space-y-3">
                      <a href="#" className="block text-primary hover:underline">
                        → Разблокировка крипты (Fansly)
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">
                        → Telegram
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">
                        → Консалтинг
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">
                        → Анкета для новых моделей
                      </a>
                      <a href="#" className="block text-foreground/80 hover:text-primary transition-colors">
                        → Telegram‑группа
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-border">
                  <p className="text-muted-foreground mb-4">
                    Рекрут моделей открыт — заполните анкету и получите стартовый план.
                  </p>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Заполнить анкету
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
