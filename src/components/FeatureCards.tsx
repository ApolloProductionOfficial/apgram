import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureCardsProps {
  features: Feature[];
}

const FeatureCards = ({ features }: FeatureCardsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ 
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          className="relative glass rounded-xl md:rounded-2xl p-5 md:p-6 text-center group cursor-pointer overflow-hidden border border-transparent hover:border-primary/30"
        >
          {/* Background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-500 rounded-xl md:rounded-2xl" />
          
          {/* Animated border */}
          <div className="absolute inset-0 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div 
              className="absolute inset-0 rounded-xl md:rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite'
              }}
            />
          </div>
          
          {/* Icon container */}
          <motion.div 
            className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 md:mb-5"
            whileHover={{ 
              rotate: [0, -10, 10, -5, 0],
              transition: { duration: 0.5 }
            }}
          >
            <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-primary transition-transform duration-300 group-hover:scale-110" />
          </motion.div>
          
          {/* Content */}
          <h3 className="relative text-sm md:text-lg font-semibold mb-1.5 md:mb-2 transition-colors duration-300 group-hover:text-primary">
            {feature.title}
          </h3>
          <p className="relative text-xs md:text-sm text-muted-foreground leading-relaxed transition-colors duration-300 group-hover:text-foreground/80">
            {feature.description}
          </p>
          
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full group-hover:w-1/2 transition-all duration-500" />
        </motion.div>
      ))}
    </div>
  );
};

export default FeatureCards;
