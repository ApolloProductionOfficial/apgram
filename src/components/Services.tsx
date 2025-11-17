import { Users, TrendingUp, MessageCircle, Shield } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Users,
      title: "Рекрутинг моделей",
      description: "Подбор и онбординг талантливых создателей контента",
    },
    {
      icon: TrendingUp,
      title: "Масштабирование",
      description: "Стратегии роста и увеличения дохода",
    },
    {
      icon: MessageCircle,
      title: "Менеджмент",
      description: "Полное управление аккаунтом и коммуникацией",
    },
    {
      icon: Shield,
      title: "Безопасность",
      description: "Защита контента и работа с платформами",
    },
  ];

  return (
    <section id="services" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary">Услуги</span>
          <h2 className="text-4xl font-bold mt-4">
            Что мы предлагаем
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-gradient-card backdrop-blur-xl rounded-2xl p-6 border border-border hover:shadow-glow transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
