import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  Save, 
  Loader2, 
  MessageSquare, 
  Upload,
  Film,
  Trash2,
  Send,
  Edit3
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionsEditor } from "./QuestionsEditor";
import { QuestionnairePreview } from "./QuestionnairePreview";

export function BotEditor() {
  // Welcome message settings
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [welcomeMediaUrl, setWelcomeMediaUrl] = useState("");
  const [welcomeMediaType, setWelcomeMediaType] = useState<string>("video");
  const [ownerChatId, setOwnerChatId] = useState<number | null>(null);
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWelcomeSettings();
  }, []);

  const fetchWelcomeSettings = async () => {
    const { data } = await supabase
      .from("bot_welcome_settings")
      .select("welcome_message, welcome_media_url, welcome_media_type, owner_telegram_chat_id")
      .limit(1)
      .maybeSingle();

    if (data) {
      if (data.welcome_message) setWelcomeMessage(data.welcome_message);
      if (data.welcome_media_url) setWelcomeMediaUrl(data.welcome_media_url);
      if (data.welcome_media_type) setWelcomeMediaType(data.welcome_media_type);
      if (data.owner_telegram_chat_id) setOwnerChatId(data.owner_telegram_chat_id);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Неподдерживаемый формат файла. Используйте GIF, JPEG, PNG, WebP, MP4 или WebM");
      return;
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 50MB");
      return;
    }

    setIsUploading(true);
    try {
      // Determine media type from file
      let mediaType = 'photo';
      if (file.type === 'image/gif') {
        mediaType = 'animation';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `welcome-media-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error } = await supabase.storage
        .from('bot-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bot-media')
        .getPublicUrl(fileName);

      setWelcomeMediaUrl(urlData.publicUrl);
      setWelcomeMediaType(mediaType);
      toast.success("Файл загружен!");
    } catch (err) {
      console.error('Upload error:', err);
      toast.error("Ошибка загрузки файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = () => {
    setWelcomeMediaUrl("");
  };

  const saveWelcomeSettings = async () => {
    setIsSavingWelcome(true);
    try {
      const { data: existing } = await supabase
        .from("bot_welcome_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("bot_welcome_settings")
          .update({ 
            welcome_message: welcomeMessage,
            welcome_media_url: welcomeMediaUrl || null,
            welcome_media_type: welcomeMediaType
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bot_welcome_settings")
          .insert({ 
            welcome_message: welcomeMessage,
            welcome_media_url: welcomeMediaUrl || null,
            welcome_media_type: welcomeMediaType
          });

        if (error) throw error;
      }
      toast.success("Приветственное сообщение сохранено!");
    } catch (err) {
      console.error('Save welcome error:', err);
      toast.error("Ошибка сохранения");
    } finally {
      setIsSavingWelcome(false);
    }
  };

  const sendTestWelcome = async () => {
    if (!ownerChatId) {
      toast.error("Сначала настройте Chat ID владельца во вкладке Webhook");
      return;
    }

    setIsTesting(true);
    try {
      // Inline keyboard with "Заполнить анкету" button
      const inlineKeyboard = [[{ text: '📝 Заполнить анкету', callback_data: 'app_start' }]];

      // Send media if exists
      if (welcomeMediaUrl) {
        const { error: mediaError } = await supabase.functions.invoke('send-model-message', {
          body: {
            chat_id: ownerChatId,
            message: welcomeMessage || "Тестовое приветствие",
            media_url: welcomeMediaUrl,
            media_type: welcomeMediaType,
            inline_keyboard: inlineKeyboard
          }
        });
        if (mediaError) throw mediaError;
      } else {
        // Send text only
        const { error } = await supabase.functions.invoke('send-model-message', {
          body: {
            chat_id: ownerChatId,
            message: `🧪 <b>ТЕСТ ПРИВЕТСТВИЯ</b>\n\n${welcomeMessage || "Текст приветствия не настроен"}`,
            inline_keyboard: inlineKeyboard
          }
        });
        if (error) throw error;
      }
      
      toast.success("Тестовое приветствие отправлено! Проверьте Telegram.");
    } catch (err) {
      console.error('Test welcome error:', err);
      toast.error("Ошибка отправки");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Редактор бота</h2>
          <p className="text-sm text-slate-400">Настройки приветствия и вопросов анкеты</p>
        </div>
      </div>

      <Tabs defaultValue="welcome" className="w-full">
        <TabsList className="bg-slate-800/50 border border-white/5 mb-6">
          <TabsTrigger value="welcome" className="data-[state=active]:bg-violet-500">
            <MessageSquare className="w-4 h-4 mr-2" />
            Приветствие
          </TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-pink-500">
            <Edit3 className="w-4 h-4 mr-2" />
            Вопросы анкеты
          </TabsTrigger>
        </TabsList>

        <TabsContent value="welcome">
          <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  Приветственное сообщение
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestWelcome}
                  disabled={isTesting || !ownerChatId}
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Тест в Telegram
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Настройте текст и медиа, которое увидят новые пользователи при запуске бота
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!ownerChatId && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                  ⚠️ Для тестирования настройте Chat ID владельца во вкладке "Webhook"
                </div>
              )}

              {/* Welcome Message Text */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Текст приветствия
                </label>
                <Textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Добро пожаловать в Apollo Production! 🌟&#10;&#10;Мы рады видеть вас..."
                  className="bg-slate-800/50 border-purple-500/30 min-h-[120px] text-sm"
                />
                <p className="text-xs text-slate-500">
                  Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;a href="..."&gt;ссылка&lt;/a&gt;
                </p>
              </div>

              {/* Media Type */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  Тип медиа
                </label>
                <Select value={welcomeMediaType} onValueChange={setWelcomeMediaType}>
                  <SelectTrigger className="bg-slate-800/50 border-purple-500/30">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">🎬 Видео</SelectItem>
                    <SelectItem value="animation">🎞️ GIF / Анимация</SelectItem>
                    <SelectItem value="photo">🖼️ Фото</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  Загрузить медиа
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/gif,image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 border-purple-500/30 hover:bg-purple-500/10"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Загрузка..." : "Выбрать файл"}
                  </Button>
                  {welcomeMediaUrl && (
                    <Button
                      variant="outline"
                      onClick={removeMedia}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Поддерживаемые форматы: GIF, JPEG, PNG, WebP, MP4, WebM. Максимум 50MB.
                </p>
              </div>

              {/* Preview */}
              {welcomeMediaUrl && (
                <div className="p-3 rounded-lg bg-slate-800/30 border border-purple-500/20">
                  <p className="text-xs text-slate-400 mb-2">Предпросмотр:</p>
                  {welcomeMediaType === 'photo' || welcomeMediaType === 'animation' ? (
                    <img 
                      src={welcomeMediaUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-48 rounded-lg object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <video 
                      src={welcomeMediaUrl} 
                      controls 
                      className="max-w-full max-h-48 rounded-lg"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              )}

              <Button
                onClick={saveWelcomeSettings}
                disabled={isSavingWelcome}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                {isSavingWelcome ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить приветствие
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <QuestionsEditor />
            <QuestionnairePreview />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}