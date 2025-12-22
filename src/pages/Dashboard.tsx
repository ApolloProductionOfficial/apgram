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
  Smile
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
  summary_enabled: boolean;
  summary_time: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0088cc]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center shadow-xl shadow-[#0088cc]/30 transition-transform group-hover:scale-105">
                <Bot className="w-6 h-6 text-white" />
              </div>
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
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{phrases.length}</p>
                  <p className="text-xs text-muted-foreground">Фраз</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0088cc]/20 to-[#0088cc]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-[#0088cc]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0088cc]">{messages.length}</p>
                  <p className="text-xs text-muted-foreground">Сообщений</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">{chatSettings.length}</p>
                  <p className="text-xs text-muted-foreground">Чатов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/30 backdrop-blur-xl hover:bg-card/60 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-500">Online</p>
                  <p className="text-xs text-muted-foreground">Бот активен</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Add New Phrase */}
            <Card className="bg-card/40 border-border/30 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary-foreground" />
                  </div>
                  Новая фраза
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Команда</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">/p_</span>
                      <Input
                        value={newCommand.replace("/p_", "")}
                        onChange={(e) => setNewCommand(e.target.value.replace("/p_", ""))}
                        placeholder="название"
                        className="pl-10 bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Текст</label>
                    <Textarea
                      value={newPhrase}
                      onChange={(e) => setNewPhrase(e.target.value)}
                      placeholder="Текст сообщения..."
                      className="bg-background/50 border-border/50 min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Media Upload */}
                <div className="p-4 rounded-xl bg-background/30 border border-dashed border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Image className="w-4 h-4" />
                      <span>Медиа</span>
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
                      className="text-xs"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      {isUploading ? "Загрузка..." : "Загрузить"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={newMediaType} onValueChange={setNewMediaType}>
                      <SelectTrigger className="bg-background/50 border-border/50 text-xs h-9">
                        <SelectValue placeholder="Тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">📷 Фото</SelectItem>
                        <SelectItem value="animation">🎬 GIF</SelectItem>
                        <SelectItem value="video">🎥 Видео</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="URL или загрузи"
                      className="bg-background/50 border-border/50 text-xs h-9"
                    />
                  </div>
                </div>

                {/* Custom Emoji */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Smile className="w-4 h-4" />
                    <span>Премиум эмодзи (опционально)</span>
                  </div>
                  <Input
                    value={newCustomEmojiId}
                    onChange={(e) => setNewCustomEmojiId(e.target.value)}
                    placeholder="ID эмодзи (напр. 5368742036629364794)"
                    className="bg-background/50 border-border/50 text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Узнать ID: отправь эмодзи боту @GetCustomEmojiBot
                  </p>
                </div>

                <Button 
                  onClick={addPhrase} 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Добавить
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
              </CardHeader>
              <CardContent>
                {phrases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Пока нет фраз</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {phrases.map((phrase) => (
                      <div
                        key={phrase.id}
                        onClick={() => copyCommand(phrase.command, phrase.id)}
                        className="group p-3 rounded-xl bg-background/40 border border-border/30 hover:border-primary/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                                /{phrase.command}
                              </code>
                              {copiedId === phrase.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                              )}
                              {phrase.custom_emoji_id && <Smile className="w-3 h-3 text-purple-500" />}
                            </div>
                            <p className="text-xs text-foreground/80 line-clamp-1">{phrase.phrase}</p>
                            {phrase.media_url && (
                              <span className="text-xs text-muted-foreground">
                                {phrase.media_type === 'animation' ? '🎬' : phrase.media_type === 'video' ? '🎥' : '📷'}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); deletePhrase(phrase.id); }}
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Message History */}
          <div className="space-y-8">
            <Card className="bg-card/40 border-border/30 backdrop-blur-xl h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <History className="w-4 h-4 text-white" />
                  </div>
                  История сообщений
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    Realtime
                    <span className="inline-block w-2 h-2 ml-1 rounded-full bg-green-500 animate-pulse" />
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[580px] pr-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Нет сообщений</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-xl bg-background/40 border border-border/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {msg.is_voice ? (
                                <Mic className="w-4 h-4 text-orange-500" />
                              ) : (
                                <User className="w-4 h-4 text-[#0088cc]" />
                              )}
                              <span className="text-sm font-medium text-foreground">
                                {msg.username || 'Аноним'}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          
                          {msg.is_voice && msg.transcription ? (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">🎤 Транскрипция:</p>
                              <p className="text-sm text-foreground">{msg.transcription}</p>
                            </div>
                          ) : msg.text ? (
                            <p className="text-sm text-foreground">{msg.text}</p>
                          ) : null}
                          
                          {msg.translation && (
                            <div className="pt-2 border-t border-border/30">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Перевод:
                              </p>
                              <p className="text-sm text-primary">{msg.translation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Bot Commands */}
            <Card className="bg-gradient-to-br from-[#0088cc]/10 via-card/40 to-[#00a8e8]/10 border-[#0088cc]/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-base">
                  <Settings className="w-5 h-5 text-[#0088cc]" />
                  Команды бота
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded">/summary</code>
                  <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded">/summary_all</code>
                  <code className="text-xs font-mono text-[#0088cc] bg-[#0088cc]/10 px-2 py-1 rounded">/p_команда</code>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" /> RU ↔ EN
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;