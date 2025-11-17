import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">
              Apollo Production
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-foreground/80 hover:text-primary transition-colors">
              О нас
            </a>
            <a href="#services" className="text-foreground/80 hover:text-primary transition-colors">
              Услуги
            </a>
            <a href="#stats" className="text-foreground/80 hover:text-primary transition-colors">
              Статистика
            </a>
          </nav>
          
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
            Начать работу
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
