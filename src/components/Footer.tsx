import { Rocket } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-bold">Apollo Production</span>
          </div>
          
          <div className="text-muted-foreground text-sm">
            © 2024 Apollo Production. OnlyFans Management Agency
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Telegram
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Контакты
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
