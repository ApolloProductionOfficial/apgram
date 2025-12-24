import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Globe,
  Upload,
  History,
  Mic,
  User,
  Smile,
  Languages,
  Volume2,
  Power,
  Hash,
  Info,
  Shield,
  Clock
} from "lucide-react";

interface QuickPhrase {
  id: string;
  command: string;
  phrase: string;
  media_url?: string | null;
  media_type?: string | null;
  custom_emoji_id?: string | null;
}

interface ChatMessage {
  id: string;
  chat_id: number;
  message_id: number;
  username: string | null;
  text: string | null;
  transcription: string | null;
  translation: string | null;
  is_voice: boolean | null;
  created_at: string;
}

interface ChatSettings {
  id: string;
  chat_id: number;
  chat_title?: string | null;
  summary_enabled: boolean | null;
  summary_time: string | null;
  translator_enabled?: boolean | null;
  voice_enabled?: boolean | null;
  quick_phrases_enabled?: boolean | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading } = useAuth();
  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSettings, setChatSettings] = useState<ChatSettings[]>([]);
  const [newCommand, setNewCommand] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<string>("");
  const [newCustomEmojiId, setNewCustomEmojiId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("phrases");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Редирект только если загрузка завершена И пользователя нет
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPhrases();
      fetchChatSettings();
      fetchMessages();

      // Realtime подписка на новые сообщения
      const channel = supabase
        .channel('telegram-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'telegram_chat_messages' },
          (payload) => {
            setMessages(prev => [payload.new as ChatMessage, ...prev].slice(0, 100));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("telegram_chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      setMessages(data);
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('bot-media')
        .getPublicUrl(fileName);

      setNewMediaUrl(publicUrl);
      
      // Auto-detect media type
      if (file.type.startsWith('image/gif')) {
        setNewMediaType('animation');
      } else if (file.type.startsWith('image/')) {
        setNewMediaType('photo');
      } else if (file.type.startsWith('video/')) {
        setNewMediaType('video');
      }
      
      toast.success("Файл загружен!");
    } catch (error) {
      toast.error("Ошибка загрузки файла");
    } finally {
      setIsUploading(false);
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

    if (newCustomEmojiId.trim()) {
      insertData.custom_emoji_id = newCustomEmojiId.trim();
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
      setNewCustomEmojiId("");
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

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Текст скопирован!");
  };

  const updateChatSetting = async (chatId: number, field: string, value: boolean) => {
    const { error } = await supabase
      .from("telegram_chat_settings")
      .update({ [field]: value })
      .eq("chat_id", chatId);

    if (error) {
      toast.error("Ошибка обновления");
    } else {
      setChatSettings(prev => 
        prev.map(s => s.chat_id === chatId ? { ...s, [field]: value } : s)
      );
      toast.success("Настройки обновлены");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#0088cc]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0088cc]/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative group cursor-help">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center shadow-xl shadow-[#0088cc]/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-[#0088cc]/50">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#0088cc]/30 to-[#00a8e8]/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white">
                  <p>Панель управления Telegram ботом</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-white to-[#0088cc] bg-clip-text text-transparent">
                  Apollo Bot Manager
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#0088cc]" />
                  Telegram Automation
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Online</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                  <p>Бот активен и обрабатывает сообщения</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </header>

      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl hover:bg-slate-800/50 transition-all group overflow-hidden relative cursor-help">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{phrases.length}</p>
                      <p className="text-xs text-slate-400">Быстрых фраз</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
              <p>Заготовленные текстовые шаблоны, которые бот отправляет по команде /p_название</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl hover:bg-slate-800/50 transition-all group overflow-hidden relative cursor-help">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0088cc]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc]/30 to-[#0088cc]/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-[#0088cc]/20">
                      <MessageSquare className="w-6 h-6 text-[#0088cc]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{messages.length}</p>
                      <p className="text-xs text-slate-400">Сообщений</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
              <p>Все сообщения, которые бот обработал в подключённых чатах</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl hover:bg-slate-800/50 transition-all group overflow-hidden relative cursor-help">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/20">
                      <Hash className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{chatSettings.length}</p>
                      <p className="text-xs text-slate-400">Чатов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
              <p>Групповые чаты, в которых бот активирован и настроен</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl hover:bg-slate-800/50 transition-all group overflow-hidden relative cursor-help">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-6 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-emerald-400">Защищён</p>
                      <p className="text-xs text-slate-400">Соединение</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
              <p>Все данные зашифрованы и передаются по защищённому каналу</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-white/5 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="phrases" className="data-[state=active]:bg-[#0088cc] data-[state=active]:text-white">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Быстрые фразы
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                <p>Создание шаблонных сообщений для быстрой отправки по команде</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="chats" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки чатов
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                <p>Включение/выключение функций бота для каждого чата</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="history" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                  <History className="w-4 h-4 mr-2" />
                  История
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                <p>Лента сообщений в реальном времени со всех чатов</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>

          {/* Phrases Tab */}
          <TabsContent value="phrases" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add New Phrase */}
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    Новая фраза
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Добавьте быструю команду для бота
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Команда</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0088cc] text-sm font-mono font-bold">/p_</span>
                        <Input
                          value={newCommand.replace("/p_", "")}
                          onChange={(e) => setNewCommand(e.target.value.replace("/p_", ""))}
                          placeholder="название"
                          className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-[#0088cc] focus:ring-[#0088cc]/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Текст сообщения</label>
                      <Textarea
                        value={newPhrase}
                        onChange={(e) => setNewPhrase(e.target.value)}
                        placeholder="Текст [emoji:5368742036629364794] с эмодзи [emoji:123456789]"
                        className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 min-h-[100px] focus:border-[#0088cc] focus:ring-[#0088cc]/20 font-mono text-sm"
                      />
                      <p className="text-xs text-slate-500">
                        💎 Формат: <code className="text-purple-400 bg-purple-500/10 px-1 rounded">[emoji:ID]</code> — вставляй в любое место текста
                      </p>
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-dashed border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Image className="w-4 h-4 text-[#0088cc]" />
                        <span>Медиафайл (опционально)</span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs border-white/10 hover:bg-[#0088cc]/20 hover:border-[#0088cc]/50"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        {isUploading ? "Загрузка..." : "Загрузить с ПК"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={newMediaType} onValueChange={setNewMediaType}>
                        <SelectTrigger className="bg-slate-800/50 border-white/10 text-white text-xs h-9">
                          <SelectValue placeholder="Тип медиа" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="photo">📷 Фото</SelectItem>
                          <SelectItem value="animation">🎬 GIF</SelectItem>
                          <SelectItem value="video">🎥 Видео</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="URL или загрузи файл"
                        className="bg-slate-800/50 border-white/10 text-white text-xs h-9 placeholder:text-slate-500"
                      />
                    </div>
                    {newMediaUrl && (
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Файл загружен
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={addPhrase} 
                    className="w-full bg-gradient-to-r from-[#0088cc] to-[#00a8e8] hover:from-[#0077b5] hover:to-[#0099cc] shadow-lg shadow-[#0088cc]/25 text-white font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Добавить фразу
                  </Button>
                </CardContent>
              </Card>

              {/* Phrases List */}
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    Ваши фразы
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Нажмите на фразу, чтобы скопировать команду
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {phrases.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Пока нет фраз</p>
                      <p className="text-xs mt-2">Добавьте первую фразу слева</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-2">
                      <div className="space-y-2">
                        {phrases.map((phrase) => (
                          <div
                            key={phrase.id}
                            className="group p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-[#0088cc]/40 hover:bg-slate-800/50 transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-2 flex-1 min-w-0" onClick={() => copyCommand(phrase.command, phrase.id)}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-sm font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded-lg border border-[#0088cc]/20">
                                    /{phrase.command}
                                  </code>
                                  {copiedId === phrase.id ? (
                                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                                      <Check className="w-3 h-3" /> Скопировано
                                    </span>
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                  {phrase.custom_emoji_id && (
                                    <span className="text-xs text-purple-400 flex items-center gap-1">
                                      <Smile className="w-3 h-3" /> Premium
                                    </span>
                                  )}
                                  {phrase.media_url && (
                                    <span className="text-xs text-slate-400">
                                      {phrase.media_type === 'animation' ? '🎬 GIF' : phrase.media_type === 'video' ? '🎥 Видео' : '📷 Фото'}
                                    </span>
                                  )}
                                </div>
                                <p 
                                  className="text-sm text-slate-300 line-clamp-2 cursor-pointer hover:text-white transition-colors"
                                  onClick={(e) => { e.stopPropagation(); copyText(phrase.phrase); }}
                                  title="Нажмите, чтобы скопировать текст"
                                >
                                  {phrase.phrase}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); deletePhrase(phrase.id); }}
                                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Settings Tab */}
          <TabsContent value="chats" className="space-y-6">
            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  Настройки по чатам
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Включайте и выключайте функции бота для каждого чата отдельно
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chatSettings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Hash className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Нет подключённых чатов</p>
                    <p className="text-xs mt-2">Добавьте бота в чат и напишите /start</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {chatSettings.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-5 rounded-xl bg-slate-800/30 border border-white/5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
                              <Hash className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{chat.chat_title || `Chat ${chat.chat_id}`}</p>
                              <p className="text-xs text-slate-500">ID: {chat.chat_id}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Translator Toggle */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 cursor-help hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Languages className="w-4 h-4 text-[#0088cc]" />
                                  <span className="text-sm text-slate-300">Переводчик</span>
                                </div>
                                <Switch
                                  checked={chat.translator_enabled ?? true}
                                  onCheckedChange={(checked) => updateChatSetting(chat.chat_id, 'translator_enabled', checked)}
                                  className="data-[state=checked]:bg-[#0088cc]"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                              <p>Автоматический перевод сообщений RU ↔ EN</p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Voice Toggle */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 cursor-help hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Volume2 className="w-4 h-4 text-orange-400" />
                                  <span className="text-sm text-slate-300">Голосовые</span>
                                </div>
                                <Switch
                                  checked={chat.voice_enabled ?? true}
                                  onCheckedChange={(checked) => updateChatSetting(chat.chat_id, 'voice_enabled', checked)}
                                  className="data-[state=checked]:bg-orange-500"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                              <p>Транскрипция и перевод голосовых сообщений</p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Quick Phrases Toggle */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 cursor-help hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-emerald-400" />
                                  <span className="text-sm text-slate-300">Быстрые фразы</span>
                                </div>
                                <Switch
                                  checked={chat.quick_phrases_enabled ?? true}
                                  onCheckedChange={(checked) => updateChatSetting(chat.chat_id, 'quick_phrases_enabled', checked)}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                              <p>Команды /p_название для отправки шаблонов</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <History className="w-4 h-4 text-white" />
                  </div>
                  История сообщений
                  <span className="ml-auto flex items-center gap-1 text-xs font-normal text-slate-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Realtime
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Нет сообщений</p>
                      <p className="text-xs mt-2">Сообщения появятся здесь в реальном времени</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-4 rounded-xl bg-slate-800/30 border border-white/5 space-y-2 hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {msg.is_voice ? (
                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                                  <Mic className="w-3 h-3 text-orange-400" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#0088cc]/20 flex items-center justify-center">
                                  <User className="w-3 h-3 text-[#0088cc]" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-white">
                                {msg.username || 'Аноним'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          
                          {msg.is_voice && msg.transcription ? (
                            <div className="space-y-1">
                              <p className="text-xs text-orange-400/70">🎤 Транскрипция:</p>
                              <p className="text-sm text-slate-300">{msg.transcription}</p>
                            </div>
                          ) : msg.text ? (
                            <p className="text-sm text-slate-300">{msg.text}</p>
                          ) : null}
                          
                          {msg.translation && (
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-xs text-[#0088cc]/70 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Перевод:
                              </p>
                              <p className="text-sm text-[#0088cc]">{msg.translation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bot Commands Footer */}
        <Card className="bg-gradient-to-r from-[#0088cc]/10 via-slate-900/50 to-[#00a8e8]/10 border-[#0088cc]/20 backdrop-blur-xl">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-slate-400">Команды:</span>
              <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-3 py-1.5 rounded-lg border border-[#0088cc]/20">/start</code>
              <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-3 py-1.5 rounded-lg border border-[#0088cc]/20">/summary</code>
              <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-3 py-1.5 rounded-lg border border-[#0088cc]/20">/summary_all</code>
              <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-3 py-1.5 rounded-lg border border-[#0088cc]/20">/p_команда</code>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Globe className="w-3 h-3" /> RU ↔ EN авто
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    </TooltipProvider>
  );
};

export default Dashboard;
