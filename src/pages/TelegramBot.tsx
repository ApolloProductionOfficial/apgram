import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Plus, Trash2, Copy, MessageSquare, Languages, Mic, FileText } from "lucide-react";
import Header from "@/components/Header";

interface QuickPhrase {
  id: string;
  command: string;
  phrase: string;
  created_at: string;
}

const TelegramBot = () => {
  const { user, isLoading: loading } = useAuth();
  const navigate = useNavigate();
  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [newCommand, setNewCommand] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPhrases();
    }
  }, [user]);

  const fetchPhrases = async () => {
    const { data, error } = await supabase
      .from("telegram_quick_phrases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching phrases:", error);
      return;
    }

    setPhrases(data || []);
  };

  const addPhrase = async () => {
    if (!newCommand.trim() || !newPhrase.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    const command = newCommand.replace(/^\//, "").replace(/\s/g, "_");

    setIsLoading(true);
    const { error } = await supabase.from("telegram_quick_phrases").insert({
      user_id: user?.id,
      command,
      phrase: newPhrase,
    });

    if (error) {
      toast.error("Ошибка при добавлении фразы");
      console.error(error);
    } else {
      toast.success("Фраза добавлена");
      setNewCommand("");
      setNewPhrase("");
      fetchPhrases();
    }
    setIsLoading(false);
  };

  const deletePhrase = async (id: string) => {
    const { error } = await supabase
      .from("telegram_quick_phrases")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка при удалении");
    } else {
      toast.success("Фраза удалена");
      fetchPhrases();
    }
  };

  const copyWebhookUrl = () => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`;
    navigator.clipboard.writeText(url);
    toast.success("URL скопирован в буфер обмена");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Telegram Бот-Переводчик</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Автоматический перевод сообщений, транскрипция голосовых и ежедневные саммари
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <Languages className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Автоперевод</h3>
                <p className="text-sm text-muted-foreground">Рус ↔ Другие языки</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <Mic className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Голосовые</h3>
                <p className="text-sm text-muted-foreground">Транскрипция + озвучка</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <FileText className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Саммари</h3>
                <p className="text-sm text-muted-foreground">Выжимка из чата</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Быстрые фразы</h3>
                <p className="text-sm text-muted-foreground">Команды в чате</p>
              </CardContent>
            </Card>
          </div>

          {/* Webhook Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Настройка Webhook</CardTitle>
              <CardDescription>
                Установите webhook для вашего бота через BotFather или API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={copyWebhookUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Выполните в браузере или через curl:
              </p>
              <code className="block p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                https://api.telegram.org/bot[YOUR_BOT_TOKEN]/setWebhook?url={import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-bot
              </code>
            </CardContent>
          </Card>

          {/* Quick Phrases */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые фразы</CardTitle>
              <CardDescription>
                Добавьте фразы, которые будут отправляться по команде /название
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new phrase */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Команда</label>
                    <div className="flex items-center">
                      <span className="text-muted-foreground mr-1">/</span>
                      <Input
                        placeholder="hello"
                        value={newCommand}
                        onChange={(e) => setNewCommand(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">Фраза</label>
                    <Textarea
                      placeholder="Привет! Как дела?"
                      value={newPhrase}
                      onChange={(e) => setNewPhrase(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <Button onClick={addPhrase} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить фразу
                </Button>
              </div>

              {/* Existing phrases */}
              <div className="space-y-3">
                {phrases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Нет сохранённых фраз
                  </p>
                ) : (
                  phrases.map((phrase) => (
                    <div
                      key={phrase.id}
                      className="flex items-start justify-between p-4 bg-card border border-border rounded-lg"
                    >
                      <div className="space-y-1">
                        <code className="text-primary font-mono">/{phrase.command}</code>
                        <p className="text-sm text-foreground">{phrase.phrase}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePhrase(phrase.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commands Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Доступные команды</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <code className="text-primary">/start</code>
                  <span className="text-muted-foreground text-sm">Приветствие и инструкция</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <code className="text-primary">/summary</code>
                  <span className="text-muted-foreground text-sm">Саммари за последние 24 часа</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <code className="text-primary">/summary_all</code>
                  <span className="text-muted-foreground text-sm">Полный отчёт за всё время</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <code className="text-primary">/phrases</code>
                  <span className="text-muted-foreground text-sm">Информация о быстрых фразах</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TelegramBot;
