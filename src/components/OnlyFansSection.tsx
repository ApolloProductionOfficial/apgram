import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  MessageCircle, 
  RefreshCw,
  Heart,
  BarChart3,
  Settings,
  Plus,
  Clock,
  Activity,
  ArrowUpDown,
  Filter,
  Timer
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  earnings_history?: { date: string; amount: number }[];
}

interface OnlyFansStats {
  total_accounts: number;
  total_subscribers: number;
  total_earnings_today: number;
  total_earnings_month: number;
  total_pending_messages: number;
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 минут

export function OnlyFansSection() {
  const [accounts, setAccounts] = useState<OnlyFansAccount[]>([]);
  const [stats, setStats] = useState<OnlyFansStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [apiConnected, setApiConnected] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [nextSyncIn, setNextSyncIn] = useState(SYNC_INTERVAL);
  
  // Фильтрация и сортировка
  const [sortBy, setSortBy] = useState<'earnings' | 'subscribers' | 'name'>('earnings');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('onlymonster-api', {
        body: { action: 'get_accounts' }
      });

      if (error) throw error;

      if (data?.accounts) {
        // Добавляем моковые данные для графика (в реальности это придёт с API)
        const enrichedAccounts = data.accounts.map((acc: OnlyFansAccount) => ({
          ...acc,
          earnings_history: generateMockEarningsHistory()
        }));
        setAccounts(enrichedAccounts);
        calculateStats(enrichedAccounts);
      }
      
      setLastSyncTime(new Date());
      setNextSyncIn(SYNC_INTERVAL);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Генерация mock данных для графика (до подключения реального API)
  const generateMockEarningsHistory = () => {
    const history = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 500) + 50
      });
    }
    return history;
  };

  useEffect(() => {
    checkApiConnection();
  }, []);

  // Автосинхронизация каждые 5 минут
  useEffect(() => {
    if (!autoSyncEnabled || !apiConnected) return;

    const syncInterval = setInterval(() => {
      console.log('Auto-syncing OnlyMonster accounts...');
      fetchData();
      toast.info("Данные обновлены автоматически", { duration: 2000 });
    }, SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [autoSyncEnabled, apiConnected, fetchData]);

  // Обратный отсчёт до следующей синхронизации
  useEffect(() => {
    if (!autoSyncEnabled || !apiConnected) return;

    const countdownInterval = setInterval(() => {
      setNextSyncIn(prev => {
        if (prev <= 1000) return SYNC_INTERVAL;
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoSyncEnabled, apiConnected]);

  const checkApiConnection = async () => {
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

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Фильтрация и сортировка аккаунтов
  const filteredAndSortedAccounts = [...accounts]
    .filter(acc => {
      if (filterStatus === 'active') return acc.is_active;
      if (filterStatus === 'inactive') return !acc.is_active;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'earnings':
          comparison = (a.earnings_month || 0) - (b.earnings_month || 0);
          break;
        case 'subscribers':
          comparison = (a.subscribers || 0) - (b.subscribers || 0);
          break;
        case 'name':
          comparison = (a.display_name || a.username).localeCompare(b.display_name || b.username);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Данные для графика всех аккаунтов
  const getChartData = () => {
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      return account?.earnings_history || [];
    }
    
    // Агрегируем данные по всем аккаунтам
    const aggregated: { [date: string]: number } = {};
    accounts.forEach(acc => {
      acc.earnings_history?.forEach(({ date, amount }) => {
        aggregated[date] = (aggregated[date] || 0) + amount;
      });
    });
    
    return Object.entries(aggregated)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
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
      {/* Auto-sync indicator */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800/30 border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-sm text-slate-400">
            Автосинхронизация: {autoSyncEnabled ? 'Включена' : 'Выключена'}
          </span>
          {lastSyncTime && (
            <span className="text-xs text-slate-500">
              (последняя: {lastSyncTime.toLocaleTimeString('ru-RU')})
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {autoSyncEnabled && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Timer className="w-3 h-3" />
              <span>Следующее обновление: {formatTimeRemaining(nextSyncIn)}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
            className={`text-xs ${autoSyncEnabled ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-500/30'}`}
          >
            {autoSyncEnabled ? 'Отключить' : 'Включить'}
          </Button>
        </div>
      </div>

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
              <TabsTrigger value="chart" className="text-xs data-[state=active]:bg-teal-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                График
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
                  {filteredAndSortedAccounts.slice(0, 5).map((account) => (
                    <div
                      key={account.id}
                      className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setActiveTab('chart');
                      }}
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

            <TabsContent value="chart">
              <div className="space-y-4">
                {/* Account selector */}
                <div className="flex items-center gap-4">
                  <Select 
                    value={selectedAccountId || 'all'} 
                    onValueChange={(v) => setSelectedAccountId(v === 'all' ? null : v)}
                  >
                    <SelectTrigger className="w-[250px] bg-slate-800/50 border-white/10">
                      <SelectValue placeholder="Выберите аккаунт" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все аккаунты (сумма)</SelectItem>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.display_name || acc.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    Доход за последние 14 дней
                  </p>
                </div>

                {/* Chart */}
                <div className="h-[350px] p-4 rounded-xl bg-slate-800/30 border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}.${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                        formatter={(value: number) => [formatCurrency(value), 'Доход']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Доход" 
                        stroke="#14b8a6" 
                        strokeWidth={2}
                        dot={{ fill: '#14b8a6', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#14b8a6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="accounts">
              {/* Filter & Sort controls */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={filterStatus} onValueChange={(v: 'all' | 'active' | 'inactive') => setFilterStatus(v)}>
                    <SelectTrigger className="w-[140px] bg-slate-800/50 border-white/10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="inactive">Неактивные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  <Select value={sortBy} onValueChange={(v: 'earnings' | 'subscribers' | 'name') => setSortBy(v)}>
                    <SelectTrigger className="w-[160px] bg-slate-800/50 border-white/10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earnings">По доходу</SelectItem>
                      <SelectItem value="subscribers">По подписчикам</SelectItem>
                      <SelectItem value="name">По имени</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="border-white/10"
                  >
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </Button>
                </div>

                <span className="text-sm text-slate-500 ml-auto">
                  Показано: {filteredAndSortedAccounts.length} из {accounts.length}
                </span>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="grid gap-3">
                  {filteredAndSortedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setActiveTab('chart');
                      }}
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

                <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white mb-1">Автосинхронизация</p>
                      <p className="text-xs text-slate-500">Обновлять данные каждые 5 минут</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                      className={autoSyncEnabled ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-500/30'}
                    >
                      {autoSyncEnabled ? 'Включено' : 'Выключено'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
