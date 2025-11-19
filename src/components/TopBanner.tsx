import { useTranslation } from "@/hooks/useTranslation";

const TopBanner = () => {
  const { t } = useTranslation();
  
  return (
    <div className="relative left-0 right-0 z-40 bg-primary/80 text-primary-foreground py-1 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <span className="text-xs sm:text-sm font-medium opacity-80">
          {t.topBanner.project}
        </span>
        <a 
          href="https://onlyreddit.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
        >
          {t.topBanner.link} 
        </a>
      </div>
    </div>
  );
};

export default TopBanner;
