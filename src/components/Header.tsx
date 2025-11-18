import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-[40px] left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">
              Apollo Production — OnlyFans Management Agency
            </span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#about" className="text-sm text-foreground/80 hover:text-primary transition-colors">
              О нас
            </a>
            <a href="#traffic" className="text-sm text-foreground/80 hover:text-primary transition-colors">
              Источники трафика
            </a>
            <a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">
              Услуги
            </a>
            <a href="#infrastructure" className="text-sm text-foreground/80 hover:text-primary transition-colors">
              Инфраструктура
            </a>
            <Button 
              size="sm"
              className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white"
              onClick={() => window.open('https://onlyreddit.com', '_blank')}
            >
              Reddit сайт
            </Button>
          </nav>
          
          <button className="lg:hidden text-sm text-primary">
            Русский ▼
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
