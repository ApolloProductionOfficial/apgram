import { useState } from "react";

const Sidebar = () => {
  const [activeTheme, setActiveTheme] = useState(0);

  const themes = [
    {
      title: "5 лет на рынке",
      subtitle: "О нас",
      description: "Помогали открывать агентства, собрали лучший опыт и ошибки — строим своё OnlyFans‑агентство полного цикла. Вы — создаёте, мы — масштабируем.",
      links: [
        { text: "Связаться в Telegram", url: "https://t.me/Apollo_Production" },
        { text: "Анкета для моделей", url: "https://docs.google.com/forms/d/e/1FAIpQLSdImReNAMa_AQ74PYbBosGLMbm7FJnSaGkuq-QIJDlDNdnW5Q/viewform" }
      ]
    }
  ];

  const quickLinks = [
    { text: "Разблокировка крипты (Fansly)", url: "/#/onlyfans" },
    { text: "Telegram", url: "https://t.me/Apollo_Production" },
    { text: "Консалтинг", url: "https://t.me/Apollo_Production" },
    { text: "Запуск", url: "https://t.me/Apollo_Production" },
    { text: "Анкета для новых моделей", url: "https://docs.google.com/forms/d/e/1FAIpQLSdImReNAMa_AQ74PYbBosGLMbm7FJnSaGkuq-QIJDlDNdnW5Q/viewform" },
    { text: "Telegram‑группа", url: "https://t.me/MenuOnly4Friends" }
  ];

  return (
    <aside className="fixed left-0 top-[52px] bottom-0 w-80 bg-card border-r border-border overflow-y-auto p-6 hidden lg:block">
      <div className="space-y-6">
        {/* Theme Selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Темы</span>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setActiveTheme(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    activeTheme === i ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button className="text-muted-foreground hover:text-foreground">‹</button>
              <button className="text-muted-foreground hover:text-foreground">›</button>
            </div>
          </div>
        </div>

        {/* Active Theme Content */}
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">{themes[activeTheme].title}</p>
            <h3 className="text-lg font-semibold mb-2">{themes[activeTheme].subtitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {themes[activeTheme].description}
            </p>
            <div className="flex flex-col gap-2">
              {themes[activeTheme].links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Быстрые ссылки</h4>
          <ul className="space-y-2">
            {quickLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Recruitment CTA */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Рекрут моделей открыт — заполните анкету и получите стартовый план.
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdImReNAMa_AQ74PYbBosGLMbm7FJnSaGkuq-QIJDlDNdnW5Q/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Заполнить анкету
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
