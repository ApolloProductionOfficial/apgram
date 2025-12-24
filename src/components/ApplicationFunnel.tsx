import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  User, 
  MessageCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Bell,
  Send
} from "lucide-react";

interface StepStats {
  step: string;
  stepOrder: number;
  count: number;
  label: string;
}

interface StuckApplication {
  id: string;
  telegram_username: string | null;
  telegram_user_id: number;
  full_name: string | null;
  step: string;
  created_at: string;
  updated_at: string;
  hoursStuck: number;
}

const STEP_LABELS: Record<string, string> = {
  start: 'Начало',
  welcome: 'Приветствие',
  full_name: 'Имя',
  age: 'Возраст',
  country: 'Страна',
  height_weight: 'Рост/Вес',
  body_params: 'Параметры',
  hair_color: 'Цвет волос',
  languages: 'Языки',
  platforms: 'Платформы',
  social_links: 'Соцсети',
  equipment: 'Оборудование',
  time_availability: 'Время',
  desired_income: 'Доход',
  portfolio_photos: 'Фото',
  about_yourself: 'О себе',
  content_willingness: 'Готовность',
  strong_points: 'Сильные стороны',
  complete: 'Завершено'
};

const STEP_ORDER: Record<string, number> = {
  start: 0,
  welcome: 1,
  full_name: 2,
  age: 3,
  country: 4,
  height_weight: 5,
  body_params: 6,
  hair_color: 7,
  languages: 8,
  platforms: 9,
  social_links: 10,
  equipment: 11,
  time_availability: 12,
  desired_income: 13,
  portfolio_photos: 14,
  about_yourself: 15,
  content_willingness: 16,
  strong_points: 17,
  complete: 100
};

export function ApplicationFunnel() {
  const [stepStats, setStepStats] = useState<StepStats[]>([]);
  const [stuckApplications, setStuckApplications] = useState<StuckApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [totalStarted, setTotalStarted] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    setIsLoading(true);
    
    // Fetch all applications to calculate funnel
    const { data: applications, error } = await supabase
      .from("telegram_model_applications")
      .select("id, step, telegram_username, telegram_user_id, full_name, created_at, updated_at, status");

    if (error || !applications) {
      setIsLoading(false);
      return;
    }

    // Calculate step stats
    const stepCounts: Record<string, number> = {};
    const now = new Date();
    const stuckApps: StuckApplication[] = [];

    applications.forEach(app => {
      const stepOrder = STEP_ORDER[app.step] || 0;
      
      // Count how many reached each step (cumulative)
      Object.entries(STEP_ORDER).forEach(([step, order]) => {
        if (order <= stepOrder) {
          stepCounts[step] = (stepCounts[step] || 0) + 1;
        }
      });

      // Check for stuck applications (in_progress and more than 24 hours)
      if (app.status === 'in_progress' && app.step !== 'complete') {
        const updatedAt = new Date(app.updated_at);
        const hoursStuck = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60));
        
        if (hoursStuck >= 24) {
          stuckApps.push({
            id: app.id,
            telegram_username: app.telegram_username,
            telegram_user_id: app.telegram_user_id,
            full_name: app.full_name,
            step: app.step,
            created_at: app.created_at,
            updated_at: app.updated_at,
            hoursStuck
          });
        }
      }
    });

    // Convert to array and sort by step order
    const stats: StepStats[] = Object.entries(stepCounts)
      .map(([step, count]) => ({
        step,
        stepOrder: STEP_ORDER[step] || 0,
        count,
        label: STEP_LABELS[step] || step
      }))
      .filter(s => s.stepOrder > 0 && s.stepOrder < 100) // Exclude start and complete from funnel
      .sort((a, b) => a.stepOrder - b.stepOrder);

    setStepStats(stats);
    setStuckApplications(stuckApps.sort((a, b) => b.hoursStuck - a.hoursStuck));
    setTotalStarted(applications.length);
    setTotalCompleted(applications.filter(a => a.step === 'complete').length);
    setIsLoading(false);
  };

  const sendStuckNotifications = async () => {
    if (stuckApplications.length === 0) {
      toast.info("Нет застрявших моделей для уведомления");
      return;
    }

    setIsSendingNotifications(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-stuck-models');
      
      if (error) throw error;
      
      if (data?.stuckCount > 0) {
        toast.success(`Уведомления отправлены о ${data.stuckCount} застрявших моделях`);
      } else {
        toast.info("Нет моделей, застрявших более 24 часов");
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error("Ошибка отправки уведомлений");
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const getDropoffRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((previous - current) / previous) * 100);
  };

  const conversionRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-white/5">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Загрузка статистики...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conversion Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{totalStarted}</p>
                <p className="text-xs text-slate-400">Начали анкету</p>
              </div>
              <User className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{totalCompleted}</p>
                <p className="text-xs text-slate-400">Завершили анкету</p>
              </div>
              <div className="text-right">
                <Badge className="bg-emerald-500/20 text-emerald-400">{conversionRate}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{stuckApplications.length}</p>
                <p className="text-xs text-slate-400">Застряли &gt;24ч</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingDown className="w-5 h-5 text-purple-400" />
                Воронка конверсии по шагам
              </CardTitle>
              <CardDescription className="text-slate-400">
                Показывает где модели отваливаются при заполнении анкеты
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFunnelData}
              className="border-purple-500/30 hover:bg-purple-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {stepStats.map((stat, index) => {
            const previousCount = index === 0 ? totalStarted : stepStats[index - 1].count;
            const dropoff = getDropoffRate(stat.count, previousCount);
            const percentage = totalStarted > 0 ? (stat.count / totalStarted) * 100 : 0;
            
            return (
              <div key={stat.step} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {stat.stepOrder}
                    </Badge>
                    <span className="text-slate-300">{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{stat.count}</span>
                    {dropoff > 0 && (
                      <Badge 
                        className={`text-xs ${
                          dropoff > 30 
                            ? 'bg-red-500/20 text-red-400' 
                            : dropoff > 15 
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        -{dropoff}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-2 bg-slate-800" />
                  {dropoff > 20 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Stuck Applications */}
      {stuckApplications.length > 0 && (
        <Card className="bg-slate-900/50 border-orange-500/20 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Модели застряли на анкете
                  <Badge className="bg-orange-500/20 text-orange-400 ml-2">
                    {stuckApplications.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Заполняют анкету более 24 часов — нужно связаться и помочь
                </CardDescription>
              </div>
              <Button
                onClick={sendStuckNotifications}
                disabled={isSendingNotifications}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSendingNotifications ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4 mr-2" />
                )}
                Уведомить команду
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stuckApplications.map((app) => (
              <div 
                key={app.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-orange-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {app.full_name || app.telegram_username || `ID: ${app.telegram_user_id}`}
                      </span>
                      {app.telegram_username && (
                        <a 
                          href={`https://t.me/${app.telegram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          @{app.telegram_username}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Застряла на:</span>
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                        {STEP_LABELS[app.step] || app.step}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{app.hoursStuck}ч</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(app.updated_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {app.telegram_username && (
                    <Button
                      size="sm"
                      asChild
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <a 
                        href={`https://t.me/${app.telegram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Написать
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}