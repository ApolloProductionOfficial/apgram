import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Unlock, MapPin, Video, Instagram, HandshakeIcon, Shield, Filter, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useButtonSound } from "@/hooks/useButtonSound";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apolloLogoVideo from "@/assets/apollo-logo.mp4";
import backgroundVideo from "@/assets/background-video-new.mp4";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Services = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { playClickSound } = useButtonSound();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    playClickSound();
    if (window.innerWidth < 768) {
      navigate('/');
      setTimeout(() => {
        const event = new CustomEvent('open-mobile-menu');
        window.dispatchEvent(event);
      }, 100);
    } else {
      navigate("/");
    }
  };

  const handleServiceClick = (path: string) => {
    playClickSound();
    navigate(path);
  };

  useEffect(() => {
    const observers = cardRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => new Set(prev).add(index));
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer, index) => {
        if (observer && cardRefs.current[index]) {
          observer.disconnect();
        }
      });
    };
  }, []);

  const services = [
    {
      id: "partnership",
      title: t.services.partnership.title,
      description: t.services.partnership.description,
      icon: HandshakeIcon,
      path: "/partnership-program",
      targetAudience: "agencies",
      platforms: ["onlyfans", "fansly"],
    },
    {
      id: "crypto",
      title: t.services.crypto.title,
      description: t.services.crypto.description,
      icon: Unlock,
      path: "/crypto-unlock",
      targetAudience: "both",
      platforms: ["onlyfans", "fansly"],
    },
    {
      id: "verification",
      title: t.services.verification.title,
      description: t.services.verification.description,
      icon: Shield,
      path: "/model-verification",
      targetAudience: "models",
      platforms: ["onlyfans"],
    },
    {
      id: "recruitment",
      title: "Набор моделей",
      description: "Ищем моделей для работы на всех платформах",
      icon: HandshakeIcon,
      path: "/model-recruitment",
      targetAudience: "models",
      platforms: ["onlyfans", "fansly", "loyalfans", "manyvids", "webcam"],
    },
    {
      id: "dubai",
      title: t.services.dubai.title,
      description: t.services.dubai.description,
      icon: MapPin,
      path: "/dubai-residency",
      targetAudience: "models",
      platforms: ["onlyfans", "fansly"],
    },
    {
      id: "webcam",
      title: t.services.webcam.title,
      description: t.services.webcam.description,
      icon: Video,
      path: "/webcam-services",
      targetAudience: "models",
      platforms: ["webcam"],
    },
    {
      id: "automation",
      title: t.services.automation.title,
      description: t.services.automation.description,
      icon: Instagram,
      path: "/instagram-automation",
      targetAudience: "both",
      platforms: ["instagram", "tiktok", "reddit"],
    },
    {
      id: "marketplace",
      title: t.marketplace?.title || "Marketplace | Only4riend",
      description: t.marketplace?.subtitle || "Площадка покупки и продажи контактов моделей",
      icon: Users,
      path: "/marketplace",
      targetAudience: "both",
      platforms: ["onlyfans", "fansly"],
    },
  ];

  const filteredServices = services.filter(service => {
    const matchesPlatform = filterPlatform === "all" || 
                           service.platforms.includes(filterPlatform);
    return matchesPlatform;
  });

  const ServiceCard = ({ service, index }: { service: typeof services[0], index: number }) => {
    const Icon = service.icon;
    const isVisible = visibleCards.has(index);

    return (
      <Card
        ref={(el) => {
          cardRefs.current[index] = el;
        }}
        className={`group relative overflow-hidden cursor-pointer border border-primary/30 bg-card/60 backdrop-blur-xl hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 hover:scale-[1.02] ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
        style={{
          transitionDelay: `${index * 100}ms`,
        }}
        onClick={() => handleServiceClick(service.path)}
      >
        {/* Animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent blur-xl" />
        
        {/* Mobile: Horizontal Layout */}
        <div className="md:hidden flex items-center gap-3 p-4 relative z-10">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/20">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold leading-tight mb-1 group-hover:text-primary transition-colors">{service.title}</h3>
            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
              {service.description}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop: Vertical Layout */}
        <div className="hidden md:flex flex-col items-center text-center space-y-4 p-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/20 shadow-lg shadow-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{service.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {service.description}
          </p>
          <Button variant="outline" className="mt-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 border-primary/30">
            {t.common.learnMore}
          </Button>
        </div>
        
        {/* Animated corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full" />
      </Card>
    );
  };

  // Splash Screen
  if (showSplash) {
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-[9999] bg-[#030305] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.25 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src={backgroundVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-[#030305]/90 to-[#030305]" />
          </motion.div>
          
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[100px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.4, 0.2] }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />

          <motion.div
            className="relative z-10 mb-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="absolute -inset-3 rounded-full bg-primary/20 blur-xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -inset-2 rounded-full border-2 border-primary/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-primary/50 shadow-[0_0_30px_rgba(6,182,228,0.4)]">
              <video src={apolloLogoVideo} autoPlay loop muted playsInline preload="auto" className="w-full h-full object-cover scale-125" />
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          >
            <motion.p
              className="text-xs text-primary/70 mb-2 tracking-[0.3em] uppercase font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Apollo Production
            </motion.p>
            
            <motion.h1
              className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              SERVICES
            </motion.h1>
          </motion.div>

          <motion.div
            className="absolute bottom-12 w-40 h-1 bg-muted/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#030305] text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Video background */}
      <div className="fixed inset-0 overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-15">
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-[#030305]/90 to-[#030305]" />
      </div>

      {/* Animated glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 md:mb-8 hover:bg-primary/10 transition-colors border border-primary/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.common.back}
        </Button>

        <div className="max-w-7xl mx-auto space-y-6 md:space-y-12">
          <motion.div 
            className="text-center space-y-3 md:space-y-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {t.services.title}
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.services.subtitle}
            </p>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 max-w-3xl mx-auto pt-2 md:pt-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Фильтр по платформе:</span>
              </div>

              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-[200px] bg-card/60 backdrop-blur border-primary/20">
                  <SelectValue placeholder="Платформа" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-primary/20 z-50">
                  <SelectItem value="all">Все платформы</SelectItem>
                  <SelectItem value="onlyfans">OnlyFans</SelectItem>
                  <SelectItem value="fansly">Fansly</SelectItem>
                  <SelectItem value="loyalfans">LoyalFans</SelectItem>
                  <SelectItem value="manyvids">ManyVids</SelectItem>
                  <SelectItem value="webcam">Webcam</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                </SelectContent>
              </Select>

              {filterPlatform !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterPlatform("all")}
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  Сбросить
                </Button>
              )}
            </div>
          </motion.div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                Нет услуг, соответствующих выбранным фильтрам
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {filteredServices.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}
            </div>
          )}

          <motion.div 
            className="border border-primary/20 rounded-2xl p-4 md:p-8 bg-card/40 backdrop-blur-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-xl md:text-3xl font-bold text-center mb-4 md:mb-8 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {t.services.howItWorks}
            </h2>
            <div className="grid md:grid-cols-4 gap-6 md:gap-8 text-xs md:text-sm text-muted-foreground">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto text-primary font-bold text-lg border border-primary/20">1</div>
                <h3 className="font-semibold text-base text-foreground">{t.services.step1}</h3>
                <p className="text-muted-foreground">{t.services.step1Desc}</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto text-primary font-bold text-lg border border-primary/20">2</div>
                <h3 className="font-semibold text-base text-foreground">{t.services.step2}</h3>
                <p className="text-muted-foreground">{t.services.step2Desc}</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto text-primary font-bold text-lg border border-primary/20">3</div>
                <h3 className="font-semibold text-base text-foreground">{t.services.step3}</h3>
                <p className="text-muted-foreground">{t.services.step3Desc}</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto text-primary font-bold text-lg border border-primary/20">4</div>
                <h3 className="font-semibold text-base text-foreground">{t.services.step4}</h3>
                <p className="text-muted-foreground">{t.services.step4Desc}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="text-center border border-primary/20 rounded-2xl p-6 md:p-12 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {t.services.readyToStart}
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-4 md:mb-6">
              {t.services.contactDesc}
            </p>
            <Button
              size="lg"
              onClick={() => {
                playClickSound();
                window.open("https://t.me/Apollo_Production", "_blank");
              }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-lg px-10 font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
            >
              {t.common.contactTelegram}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Services;