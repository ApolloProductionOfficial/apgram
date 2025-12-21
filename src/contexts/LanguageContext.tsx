import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'ru' | 'en' | 'uk';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Map country codes to languages
const countryToLanguage: Record<string, Language> = {
  'RU': 'ru', // Russia
  'BY': 'ru', // Belarus
  'KZ': 'ru', // Kazakhstan
  'UA': 'uk', // Ukraine
  'US': 'en',
  'GB': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ru';
  });

  // Auto-detect language by IP on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('language');
    if (hasVisited) return; // Don't auto-detect if user already has a preference

    const detectLanguageByIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const countryCode = data.country_code;
        
        if (countryCode && countryToLanguage[countryCode]) {
          const detectedLang = countryToLanguage[countryCode];
          setLanguage(detectedLang);
          localStorage.setItem('language', detectedLang);
          console.log(`Language auto-detected: ${detectedLang} (country: ${countryCode})`);
        }
      } catch (error) {
        console.log('Could not detect language by IP, using default');
      }
    };

    detectLanguageByIP();
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
