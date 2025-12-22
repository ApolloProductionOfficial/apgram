import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  LogOut, 
  Send, 
  Settings,
  Clock,
  MessageSquare,
  Zap,
  Bot
} from "lucide-react";

interface QuickPhrase {
  id: string;
  command: string;
  phrase: string;
}

interface ChatSettings {
  id: string;
  chat_id: number;
  summary_enabled: boolean;
  summary_time: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [chatSettings, setChatSettings] = useState<ChatSettings[]>([]);
  const [newCommand, setNewCommand] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPhrases();
      fetchChatSettings();
    }
  }, [user]);

  const fetchPhrases = async () => {
    const { data, error } = await supabase
      .from("telegram_quick_phrases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Ошибка загрузки фраз");
    } else {
      setPhrases(data || []);
    }
    setIsLoadingData(false);
  };

  const fetchChatSettings = async () => {
    const { data, error } = await supabase
      .from("telegram_chat_settings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setChatSettings(data || []);
    }
  };

  const addPhrase = async () => {
    if (!newCommand.trim() || !newPhrase.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    const command = newCommand.startsWith("/p_") ? newCommand : `/p_${newCommand}`;

    const { error } = await supabase.from("telegram_quick_phrases").insert({
      command,
      phrase: newPhrase,
      user_id: user?.id,
    });

    if (error) {
      toast.error("Ошибка добавления фразы");
    } else {
      toast.success("Фраза добавлена");
      setNewCommand("");
      setNewPhrase("");
      fetchPhrases();
    }
  };

  const deletePhrase = async (id: string) => {
    const { error } = await supabase
      .from("telegram_quick_phrases")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления");
    } else {
      toast.success("Фраза удалена");
      fetchPhrases();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary animate-ping" />
          </div>
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Telegram Bot</h1>
              <p className="text-xs text-muted-foreground">Панель управления</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{phrases.length}</p>
                  <p className="text-sm text-muted-foreground">Быстрых фраз</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0088cc]/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[#0088cc]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{chatSettings.length}</p>
                  <p className="text-sm text-muted-foreground">Подключённых чатов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">Онлайн</p>
                  <p className="text-sm text-muted-foreground">Бот активен</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Phrase */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Plus className="w-5 h-5 text-primary" />
              Добавить быструю фразу
            </CardTitle>
            <CardDescription>
              Создайте команду для быстрой отправки сообщений в чат
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Команда
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    /p_
                  </span>
                  <Input
                    value={newCommand.replace("/p_", "")}
                    onChange={(e) => setNewCommand(e.target.value.replace("/p_", ""))}
                    placeholder="привет"
                    className="pl-10 bg-background/50 border-border/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Текст сообщения
                </label>
                <Textarea
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="Привет! Как дела?"
                  className="bg-background/50 border-border/50 min-h-[80px]"
                />
              </div>
            </div>
            <Button onClick={addPhrase} className="w-full md:w-auto bg-primary hover:bg-primary/90">
              <Send className="w-4 h-4 mr-2" />
              Добавить фразу
            </Button>
          </CardContent>
        </Card>

        {/* Phrases List */}
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageCircle className="w-5 h-5 text-primary" />
              Ваши фразы
            </CardTitle>
            <CardDescription>
              Используйте команды в любом чате с ботом
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phrases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Пока нет фраз</p>
                <p className="text-sm">Добавьте первую фразу выше</p>
              </div>
            ) : (
              <div className="space-y-3">
                {phrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    className="group flex items-start justify-between p-4 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                        {phrase.command}
                      </code>
                      <p className="text-foreground mt-2">{phrase.phrase}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePhrase(phrase.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bot Commands Info */}
        <Card className="bg-gradient-to-br from-[#0088cc]/10 to-[#0088cc]/5 border-[#0088cc]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5 text-[#0088cc]" />
              Команды бота
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded">
                    /summary
                  </code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Выжимка сообщений за последние 24 часа
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded">
                    /summary_all
                  </code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Полная выжимка за всё время
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded">
                    /p_команда
                  </code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Быстрая отправка сохранённой фразы
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0088cc]" />
                  <span className="text-sm font-medium text-foreground">Авто-перевод</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Все сообщения автоматически переводятся на русский
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
