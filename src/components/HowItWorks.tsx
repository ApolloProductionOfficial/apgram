import { motion } from 'framer-motion';
import { Video, Users, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: MessageSquare,
      number: '01',
      title: (t.aplink as any)?.howItWorks?.step1Title || 'Введите имя',
      description: (t.aplink as any)?.howItWorks?.step1Desc || 'Просто укажите своё имя для идентификации в комнате',
    },
    {
      icon: Video,
      number: '02',
      title: (t.aplink as any)?.howItWorks?.step2Title || 'Создайте комнату',
      description: (t.aplink as any)?.howItWorks?.step2Desc || 'Нажмите кнопку или введите название существующей комнаты',
    },
    {
      icon: Users,
      number: '03',
      title: (t.aplink as any)?.howItWorks?.step3Title || 'Общайтесь',
      description: (t.aplink as any)?.howItWorks?.step3Desc || 'Отправьте ссылку коллегам и начните видеозвонок',
    },
  ];

  return (
    <section className="py-16 md:py-24 relative z-10">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {(t.aplink as any)?.howItWorks?.title || 'Как это работает'}
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {(t.aplink as any)?.howItWorks?.subtitle || 'Начните видеозвонок за 30 секунд без регистрации и установки'}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="glass rounded-2xl p-6 md:p-8 text-center transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] border border-transparent hover:border-primary/30">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary/20 rounded-full border border-primary/30">
                  <span className="text-xs font-bold text-primary">{step.number}</span>
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-500 group-hover:scale-110">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-lg md:text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
