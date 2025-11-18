import { Grid, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useButtonSound } from "@/hooks/useButtonSound";

const Footer = () => {
  const { playClickSound } = useButtonSound();

  const sections = [
    {
      title: "Разделы",
      links: [
        { text: "О нас", url: "#about" },
        { text: "Источники трафика", url: "#traffic" },
        { text: "Услуги", url: "#services" },
        { text: "Инфраструктура", url: "#infrastructure" }
      ]
    }
  ];

  const contacts = [
    {
      platform: "Telegram",
      username: "@Apollo_Production",
      description: "Owner, создатель агентства",
      url: "https://t.me/Apollo_Production"
    },
    {
      platform: "Telegram",
      username: "@osckelly",
      description: "Managing Director",
      url: "https://t.me/osckelly"
    },
    {
      platform: "Группа",
      username: "Only4Friends",
      description: "Telegram-группа",
      url: "https://t.me/MenuOnly4Friends"
    }
  ];

  const handleClick = (url: string) => {
    playClickSound();
    window.open(url, '_blank');
  };

  return (
    <footer className="bg-card/50 border-t border-border py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Grid className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Apollo Production — OnlyFans Agency</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Всё, что вам нужно знать об OnlyFans: советы, стратегии и решения от APOLLO PRODUCTION.
            </p>
            <div className="pt-4">
              {sections.map((section, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-semibold mb-3">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.links.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          onClick={playClickSound}
                        >
                          {link.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ресурсы</h3>
            <p className="text-sm text-muted-foreground">
              Контакты агентства — нажмите на ник, чтобы открыть профиль в Telegram.
            </p>
            <div className="space-y-4">
              {contacts.map((contact, i) => (
                <div key={i} className="space-y-1">
                  <button
                    onClick={() => handleClick(contact.url)}
                    className="flex items-center gap-2 text-primary hover:underline group"
                  >
                    <AtSign className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{contact.platform}: {contact.username}</span>
                  </button>
                  <p className="text-xs text-muted-foreground ml-6">— {contact.description}</p>
                </div>
              ))}
            </div>
            <div className="pt-6">
              <Button
                onClick={() => handleClick('https://t.me/Apollo_Production')}
                className="bg-primary hover:bg-primary/90"
              >
                Связаться в Telegram
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 APOLLO PRODUCTION. Все права защищены.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={playClickSound}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
