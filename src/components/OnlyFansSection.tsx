import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  MessageCircle, 
  RefreshCw,
  Eye,
  Heart,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Plus,
  ExternalLink,
  Clock,
  Activity
} from "lucide-react";
import onlyfansLogo from "@/assets/onlyfans-logo.png";

interface OnlyFansAccount {
  id: string;
  username: string;
  display_name?: string;
  subscribers?: number;
  earnings_today?: number;
  earnings_month?: number;
  messages_pending?: number;
  last_sync?: string;
  is_active: boolean;
}

interface OnlyFansStats {
  total_accounts: number;
  total_subscribers: number;
  total_earnings_today: number;
  total_earnings_month: number;
  total_pending_messages: number;
}

export function OnlyFansSection() {
  const [accounts, setAccounts] = useState<OnlyFansAccount[]>([]);
  const [stats, setStats] = useState<OnlyFansStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    // Check if API key is configured (by trying to fetch data)
    try {
      const { data } = await supabase.functions.invoke('onlymonster-api', {
        body: { action: 'check_connection' }
      });
      if (data?.connected) {
        setApiConnected(true);
        fetchData();
      }
    } catch (error) {
      console.log('API not connected yet');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('onlymonster-api', {
        body: { action: 'get_accounts' }
      });

      if (error) throw error;

      if (data?.accounts) {
        setAccounts(data.accounts);
        calculateStats(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (accountsData: OnlyFansAccount[]) => {
    const stats: OnlyFansStats = {
      total_accounts: accountsData.length,
      total_subscribers: accountsData.reduce((sum, a) => sum + (a.subscribers || 0), 0),
      total_earnings_today: accountsData.reduce((sum, a) => sum + (a.earnings_today || 0), 0),
      total_earnings_month: accountsData.reduce((sum, a) => sum + (a.earnings_month || 0), 0),
      total_pending_messages: accountsData.reduce((sum, a) => sum + (a.messages_pending || 0), 0),
    };
    setStats(stats);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (!apiConnected) {
    return (
      <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center overflow-hidden p-1">
              <img src={onlyfansLogo} alt="OnlyFans" className="w-full h-full object-contain" />
            </div>
            OnlyFans Management
          </CardTitle>
          <CardDescription className="text-slate-400">
            Интеграция с OnlyMonster API для управления аккаунтами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center mx-auto mb-4 overflow-hidden p-2">
              <img src={onlyfansLogo} alt="OnlyFans" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">API подключено</h3>
            <p className="text-slate-400 text-sm mb-4">
              OnlyMonster API ключ сохранён. Нажмите кнопку ниже для загрузки данных.
            </p>
            <Button 
              onClick={() => { setApiConnected(true); fetchData(); }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Загрузить данные
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-teal-500/20">
            <p className="text-xs text-slate-500">
              <strong className="text-teal-400">API ключ:</strong> om_token_****...****a451a
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Edge Function: onlymonster-api
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.total_accounts || 0}</p>
                <p className="text-xs text-slate-500">Аккаунтов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.total_subscribers?.toLocaleString() || 0}</p>
                <p className="text-xs text-slate-500">Подписчиков</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats?.total_earnings_today || 0)}</p>
                <p className="text-xs text-slate-500">Сегодня</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats?.total_earnings_month || 0)}</p>
                <p className="text-xs text-slate-500">За месяц</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.total_pending_messages || 0}</p>
                <p className="text-xs text-slate-500">Сообщений</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center overflow-hidden p-1">
                <img src={onlyfansLogo} alt="OnlyFans" className="w-full h-full object-contain" />
              </div>
              Управление аккаунтами
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
                className="border-teal-500/30 hover:bg-teal-500/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-cyan-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50 border border-white/5 mb-4">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-teal-500">
                <BarChart3 className="w-3 h-3 mr-1" />
                Обзор
              </TabsTrigger>
              <TabsTrigger value="accounts" className="text-xs data-[state=active]:bg-teal-500">
                <Users className="w-3 h-3 mr-1" />
                Аккаунты
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs data-[state=active]:bg-teal-500">
                <MessageCircle className="w-3 h-3 mr-1" />
                Сообщения
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-teal-500">
                <Settings className="w-3 h-3 mr-1" />
                Настройки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {accounts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Нет подключённых аккаунтов</p>
                  <p className="text-xs mt-2">Добавьте аккаунт для начала работы</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {accounts.slice(0, 5).map((account) => (
                    <div
                      key={account.id}
                      className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-teal-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{account.display_name || account.username}</p>
                            <p className="text-xs text-slate-500">@{account.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-emerald-400">{formatCurrency(account.earnings_today || 0)}</p>
                            <p className="text-xs text-slate-500">сегодня</p>
                          </div>
                          <Badge className={account.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
                            {account.is_active ? "Активен" : "Неактивен"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="accounts">
              <ScrollArea className="h-[400px]">
                <div className="grid gap-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-teal-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-teal-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{account.display_name || account.username}</p>
                            <p className="text-xs text-slate-500">@{account.username}</p>
                          </div>
                        </div>
                        <Badge className={account.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
                          {account.is_active ? "Активен" : "Неактивен"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-slate-800/50">
                          <p className="text-xs text-slate-500">Подписчики</p>
                          <p className="font-medium text-white">{account.subscribers?.toLocaleString() || 0}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/50">
                          <p className="text-xs text-slate-500">Сегодня</p>
                          <p className="font-medium text-emerald-400">{formatCurrency(account.earnings_today || 0)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/50">
                          <p className="text-xs text-slate-500">За месяц</p>
                          <p className="font-medium text-yellow-400">{formatCurrency(account.earnings_month || 0)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/50">
                          <p className="text-xs text-slate-500">Сообщения</p>
                          <p className="font-medium text-blue-400">{account.messages_pending || 0}</p>
                        </div>
                      </div>

                      {account.last_sync && (
                        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Последняя синхронизация: {new Date(account.last_sync).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="messages">
              <div className="text-center py-12 text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Управление сообщениями</p>
                <p className="text-xs mt-2">Функционал чатов в разработке</p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-teal-500/20">
                  <div className="flex items-center gap-2 text-sm text-teal-300 mb-2">
                    <Activity className="w-4 h-4" />
                    <span>API подключение</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">OnlyMonster API активно</p>
                  <code className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                    om_token_****...****a451a
                  </code>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
