const Stats = () => {
  const stats = [
    {
      value: "50+",
      label: "Запусков",
    },
    {
      value: "24/7",
      label: "Поддержка",
    },
    {
      value: "ROI+",
      label: "Фокус на прибыль",
    },
  ];

  return (
    <section id="stats" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-card backdrop-blur-xl rounded-2xl p-8 border border-border hover:shadow-glow transition-all duration-300"
            >
              <div className="text-center">
                <div className="text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
