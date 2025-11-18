import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

const EarningsChart = () => {
  const data = [
    { month: 'Месяц 1', earnings: 2500, label: '2-3k+' },
    { month: 'Месяц 2', earnings: 4000, label: '3-5k+' },
    { month: 'Месяц 3', earnings: 6000, label: '5-7k+' },
    { month: 'Месяц 4', earnings: 8000, label: '7-9k+' },
    { month: 'Месяц 5', earnings: 10000, label: '9-11k+' },
    { month: 'Месяц 6', earnings: 12000, label: '11-13k+' },
    { month: 'Месяц 7', earnings: 14000, label: '13-15k+' },
    { month: 'Месяц 8', earnings: 16000, label: '15-17k+' },
    { month: 'Месяц 9', earnings: 18000, label: '17-19k+' },
    { month: 'Месяц 10', earnings: 19500, label: '18-20k+' },
    { month: 'Месяц 11', earnings: 21000, label: '19-22k+' },
    { month: 'Месяц 12', earnings: 23000, label: '20k++' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-primary/30 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-foreground">{payload[0].payload.month}</p>
          <p className="text-lg font-bold text-primary">{payload[0].payload.label}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="p-2 rounded-lg bg-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Рост дохода моделей
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Твой путь к <span className="text-primary">$20,000+</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Средний рост дохода наших моделей за первый год работы
          </p>
        </div>

        {/* Chart */}
        <div className="relative">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
          
          {/* Chart container */}
          <div className="relative bg-card/50 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-6 md:p-8 shadow-2xl shadow-primary/10">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fill="url(#colorEarnings)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">$2.5k</p>
                <p className="text-sm text-muted-foreground mt-1">Старт</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">$12k</p>
                <p className="text-sm text-muted-foreground mt-1">6 месяцев</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">$23k+</p>
                <p className="text-sm text-muted-foreground mt-1">12 месяцев</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EarningsChart;
