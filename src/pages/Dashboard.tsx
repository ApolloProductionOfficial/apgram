import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  LogOut, 
  Send, 
  Settings,
  MessageSquare,
  Zap,
  Bot,
  Image,
  Video,
  Film,
  Copy,
  Check,
  Sparkles,
  Globe
} from "lucide-react";

interface QuickPhrase {
  id: string;
  command: string;
  phrase: string;
  media_url?: string | null;
  media_type?: string | null;
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
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      toast.error("Заполните команду и текст");
      return;
    }

    const command = newCommand.replace("/p_", "").replace("/", "").trim();

    const insertData: any = {
      command: `p_${command}`,
      phrase: newPhrase,
      user_id: user?.id,
    };

    if (newMediaUrl.trim() && newMediaType) {
      insertData.media_url = newMediaUrl.trim();
      insertData.media_type = newMediaType;
    }

    const { error } = await supabase.from("telegram_quick_phrases").insert(insertData);

    if (error) {
      toast.error("Ошибка добавления фразы");
    } else {
      toast.success("Фраза добавлена!");
      setNewCommand("");
      setNewPhrase("");
      setNewMediaUrl("");
      setNewMediaType("");
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

  const copyCommand = async (command: string, id: string) => {
    await navigator.clipboard.writeText(`/${command}`);
    setCopiedId(id);
    toast.success("Команда скопирована!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center shadow-2xl shadow-[#0088cc]/40 animate-pulse">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#0088cc]/20 to-[#00a8e8]/20 blur-xl animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0088cc]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00a8e8]/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center shadow-xl shadow-[#0088cc]/30 transition-transform group-hover:scale-105">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Apollo Bot Manager
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#0088cc]" />
                Панель управления
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {phrases.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Быстрых фраз</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0088cc]/20 to-[#0088cc]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-[#0088cc]" />
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#0088cc] to-[#00a8e8] bg-clip-text text-transparent">
                    {chatSettings.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Чатов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">Онлайн</p>
                  <p className="text-sm text-muted-foreground">Бот работает</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Phrase */}
        <Card className="bg-card/40 border-border/30 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
              Добавить быструю фразу
            </CardTitle>
            <CardDescription>
              Создайте команду с текстом, GIF, фото или видео
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Команда</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">/p_</span>
                  <Input
                    value={newCommand.replace("/p_", "")}
                    onChange={(e) => setNewCommand(e.target.value.replace("/p_", ""))}
                    placeholder="название"
                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Текст сообщения</label>
                <Textarea
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="Текст, который отправится при вызове команды..."
                  className="bg-background/50 border-border/50 min-h-[80px] focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Media Section */}
            <div className="p-4 rounded-xl bg-background/30 border border-dashed border-border/50 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image className="w-4 h-4" />
                <span>Медиа (опционально)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Тип медиа</label>
                  <Select value={newMediaType} onValueChange={setNewMediaType}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-blue-500" />
                          Фото
                        </div>
                      </SelectItem>
                      <SelectItem value="animation">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-purple-500" />
                          GIF
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-red-500" />
                          Видео
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">URL медиафайла</label>
                  <Input
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://example.com/image.gif"
                    className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={addPhrase} 
              className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
            >
              <Send className="w-4 h-4 mr-2" />
              Добавить фразу
            </Button>
          </CardContent>
        </Card>

        {/* Phrases List */}
        <Card className="bg-card/40 border-border/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              Ваши фразы
            </CardTitle>
            <CardDescription>
              Нажмите на фразу, чтобы скопировать команду
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phrases.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 opacity-30" />
                </div>
                <p className="font-medium">Пока нет фраз</p>
                <p className="text-sm mt-1">Добавьте первую фразу выше</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {phrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    onClick={() => copyCommand(phrase.command, phrase.id)}
                    className="group relative p-4 rounded-xl bg-background/40 border border-border/30 hover:border-primary/40 hover:bg-background/60 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 rounded-lg">
                            /{phrase.command}
                          </code>
                          {copiedId === phrase.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2">{phrase.phrase}</p>
                        {phrase.media_url && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {phrase.media_type === 'animation' ? (
                              <Film className="w-3 h-3 text-purple-500" />
                            ) : phrase.media_type === 'video' ? (
                              <Video className="w-3 h-3 text-red-500" />
                            ) : (
                              <Image className="w-3 h-3 text-blue-500" />
                            )}
                            <span>
                              {phrase.media_type === 'animation' ? 'GIF' : phrase.media_type === 'video' ? 'Видео' : 'Фото'}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhrase(phrase.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bot Commands Info */}
        <Card className="bg-gradient-to-br from-[#0088cc]/10 via-card/40 to-[#00a8e8]/10 border-[#0088cc]/20 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0088cc]/10 rounded-full blur-2xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              Команды бота
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-background/30 space-y-2">
                <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded-lg">/summary</code>
                <p className="text-sm text-muted-foreground">Выжимка за 24 часа</p>
              </div>
              <div className="p-3 rounded-xl bg-background/30 space-y-2">
                <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded-lg">/summary_all</code>
                <p className="text-sm text-muted-foreground">Полная выжимка</p>
              </div>
              <div className="p-3 rounded-xl bg-background/30 space-y-2">
                <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded-lg">/p_команда</code>
                <p className="text-sm text-muted-foreground">Быстрая фраза</p>
              </div>
              <div className="p-3 rounded-xl bg-background/30 space-y-2 flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#0088cc]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Авто-перевод</p>
                  <p className="text-xs text-muted-foreground">RU ↔ EN</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;