import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apolloLogoVideo from "@/assets/apollo-logo.mp4";
import backgroundVideo from "@/assets/background-video-new.mp4";

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, isLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error("Неверный логин или пароль");
      } else {
        toast.success("Добро пожаловать!");
        navigate("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Splash Screen - APLink Style
  if (showSplash || isLoading) {
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-[9999] bg-[#030305] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Video background */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={backgroundVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-[#030305]/90 to-[#030305]" />
          </motion.div>
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          
          {/* Central glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[100px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0.3] }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />

          {/* Logo with rotating rings */}
          <motion.div
            className="relative z-10 mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="absolute -inset-4 rounded-full bg-primary/20 blur-xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -inset-3 rounded-full border-2 border-primary/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute -inset-5 rounded-full border border-primary/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-2 ring-primary/50 shadow-[0_0_40px_rgba(6,182,228,0.4)]">
              <video
                src={apolloLogoVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover scale-125"
              />
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            className="relative z-10 text-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            />
            
            <motion.p
              className="text-xs sm:text-sm text-primary/70 mb-3 tracking-[0.4em] uppercase font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Apollo Production
            </motion.p>
            
            <h1 className="text-3xl sm:text-5xl font-black relative z-10 flex flex-wrap justify-center tracking-tight mb-2">
              {"APOLLO".split("").map((letter, index) => (
                <motion.span
                  key={index}
                  className="inline-block relative bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
                  initial={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    filter: "blur(0px)",
                    backgroundPosition: ["200% 0", "-200% 0"],
                  }}
                  transition={{ 
                    opacity: { delay: 0.8 + index * 0.1, duration: 0.4 },
                    x: { delay: 0.8 + index * 0.1, duration: 0.4 },
                    filter: { delay: 0.8 + index * 0.1, duration: 0.4 },
                    backgroundPosition: { delay: 1.8, duration: 4, repeat: Infinity, ease: "linear" },
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
            
            <motion.p
              className="text-lg sm:text-xl text-foreground/90 font-semibold tracking-widest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              BOT MANAGER
            </motion.p>

            <motion.div
              className="w-20 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
            />
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="absolute bottom-12 w-48 h-1 bg-muted/10 rounded-full overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 1.8, duration: 1.2, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#030305] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Video background */}
      <div className="fixed inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-[#030305]/80 to-[#030305]" />
      </div>

      {/* Animated background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#0088cc]/10 rounded-full blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <Card className="w-full max-w-md bg-card/60 backdrop-blur-2xl border-primary/20 relative z-10 shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-4">
          {/* Logo with rotating rings */}
          <div className="relative mx-auto">
            <motion.div 
              className="absolute -inset-2 rounded-full bg-primary/20 blur-lg"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -inset-1.5 rounded-full border border-primary/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-lg shadow-primary/30">
              <video
                src={apolloLogoVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover scale-125"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Apollo Bot Manager
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Войдите в панель управления
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-background/30 border-primary/20 focus:border-primary/50 transition-all"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 bg-background/30 border-primary/20 focus:border-primary/50 transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Войти
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Auth;