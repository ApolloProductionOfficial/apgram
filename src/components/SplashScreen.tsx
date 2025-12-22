import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import backgroundVideo from "@/assets/background-video-new.mp4";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [stage, setStage] = useState(0);
  // 0 = video reveals, 1 = text appears, 2 = fade out

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),    // Show text
      setTimeout(() => setStage(2), 3500),   // Start fade out
      setTimeout(() => onComplete(), 4200),  // Complete at ~4 seconds
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {stage < 2 && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Bright video background */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
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
            {/* Lighter overlay - more visible video */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/50" />
          </motion.div>

          {/* Animated particles/stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Central glow - more vibrant */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/25 blur-[120px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0.6] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          {/* Secondary glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/20 blur-[80px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          />

          {/* Text content */}
          <motion.div
            className="relative z-10 text-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: stage >= 1 ? 1 : 0, 
              y: stage >= 1 ? 0 : 30 
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Decorative line */}
            <motion.div
              className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
            
            <motion.p
              className="text-sm sm:text-base text-primary/80 mb-3 tracking-[0.3em] uppercase font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 10 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Apollo Production
            </motion.p>
            
            <motion.p
              className="text-sm text-muted-foreground/70 mb-8 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 1 ? 1 : 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              представляет
            </motion.p>
            
            <motion.h1
              className="text-6xl sm:text-8xl font-bold mb-4 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: stage >= 1 ? 1 : 0, 
                scale: stage >= 1 ? 1 : 0.8 
              }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                APLink
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl sm:text-2xl text-foreground/90 font-light tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 10 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              Созвоны без границ
            </motion.p>

            {/* Decorative line bottom */}
            <motion.div
              className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: stage >= 1 ? 1 : 0, opacity: stage >= 1 ? 1 : 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            />
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="absolute bottom-16 w-48 h-1 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 10 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: stage >= 1 ? "100%" : "0%" }}
              transition={{ delay: 1, duration: 2.3, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
