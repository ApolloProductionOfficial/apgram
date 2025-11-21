import { useTranslation } from "@/hooks/useTranslation";

const TopBanner = () => {
  const { t } = useTranslation();
  
  return (
    <div className="relative left-0 right-0 z-40 bg-gradient-to-r from-card via-primary/20 to-card border-b border-primary/30 text-foreground py-1 px-4 shadow-lg shadow-primary/10">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <span className="text-xs sm:text-sm font-medium opacity-90">
          {t.topBanner.project}
        </span>
        <a 
          href="https://onlyreddit.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
          {t.topBanner.link} →
        </a>
      </div>
    </div>
  );
};

export default TopBanner;
