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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  Play,
  FileText,
  Command,
  Rabbit,
  ClipboardList,
  Edit3,
  Save,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Link,
  Search,
  Download,
  Bell,
  BarChart3,
  Camera,
  DollarSign,
  TrendingUp
} from "lucide-react";
import apolloLogo from "@/assets/cf-logo-final.png";
import apolloLogoVideo from "@/assets/apollo-logo.mp4";
import backgroundVideo from "@/assets/background-video-new.mp4";
import onlyfansLogo from "@/assets/onlyfans-icon.png";
import pimpbunnyLogo from "@/assets/pimpbunny-ears.png";
import CustomCursor from "@/components/CustomCursor";
import { ApplicationStats } from "@/components/ApplicationStats";
import { BotCommandsHelp } from "@/components/BotCommandsHelp";
import { exportApplicationToWord } from "@/utils/exportToWord";
import { OnlyFansSection } from "@/components/OnlyFansSection";
import { TeamNotificationSettings } from "@/components/TeamNotificationSettings";
import { ModelPhotosGallery } from "@/components/ModelPhotosGallery";
import { QuestionsEditor } from "@/components/QuestionsEditor";
import { QuestionnairePreview } from "@/components/QuestionnairePreview";
import { BotEditor } from "@/components/BotEditor";
import { ApplicationFunnel } from "@/components/ApplicationFunnel";
import { SendMessageDialog } from "@/components/SendMessageDialog";

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

interface ModelApplication {
  id: string;
  telegram_user_id: number;
  chat_id: number;
  telegram_username: string | null;
  full_name: string | null;
  age: number | null;
  country: string | null;
  height: string | null;
  weight: string | null;
  body_params: string | null;
  hair_color: string | null;
  language_skills: string | null;
  platforms: string[] | null;
  social_media_experience: string[] | null;
  content_preferences: string[] | null;
  tabu_preferences: string[] | null;
  equipment: string | null;
  time_availability: string | null;
  social_media_links: string | null;
  strong_points: string | null;
  desired_income: string | null;
  about_yourself: string | null;
  portfolio_photos: string[] | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface QuestionConfig {
  id: string;
  step: string;
  question: string;
  order: number;
}

const DEFAULT_QUESTIONS: QuestionConfig[] = [
  { id: '1', step: 'full_name', question: 'Как вас зовут? Напишите ваше полное имя:', order: 1 },
  { id: '2', step: 'age', question: 'Сколько вам полных лет? (только число)', order: 2 },
  { id: '3', step: 'country', question: 'Выберите вашу страну проживания:', order: 3 },
  { id: '4', step: 'height_weight', question: 'Укажите ваш рост и вес (например: 170 см / 55 кг):', order: 4 },
  { id: '5', step: 'body_params', question: 'Укажите ваши параметры фигуры (грудь-талия-бёдра):', order: 5 },
  { id: '6', step: 'hair_color', question: 'Выберите цвет волос:', order: 6 },
  { id: '7', step: 'languages', question: 'Какими языками вы владеете?', order: 7 },
  { id: '8', step: 'platforms', question: 'Есть ли у вас уже платформы, где вы работаете?', order: 8 },
  { id: '9', step: 'content_types', question: 'Какой контент вы готовы создавать?', order: 9 },
  { id: '10', step: 'experience', question: 'У вас есть опыт работы моделью?', order: 10 },
  { id: '11', step: 'social_links', question: 'Отправьте ссылки на ваши соцсети:', order: 11 },
  { id: '12', step: 'equipment', question: 'Какое оборудование у вас есть для работы?', order: 12 },
  { id: '13', step: 'time_availability', question: 'Сколько времени вы готовы уделять работе?', order: 13 },
  { id: '14', step: 'desired_income', question: 'Какой доход вы хотите получать в месяц?', order: 14 },
  { id: '15', step: 'about_yourself', question: 'Расскажите о себе максимально подробно!', order: 15 },
];

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
  const [mainTab, setMainTab] = useState("telegram-help");
  const [subTab, setSubTab] = useState("help");
  const [modelSubTab, setModelSubTab] = useState("stats");
  const [showSplash, setShowSplash] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Model applications state
  const [applications, setApplications] = useState<ModelApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ModelApplication | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Questions editor state
  const [questions, setQuestions] = useState<QuestionConfig[]>(DEFAULT_QUESTIONS);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);
  
  // Webhook setup state
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  
  // Owner notification settings
  const [ownerChatId, setOwnerChatId] = useState<string>('');
  const [modelBotToken, setModelBotToken] = useState("");
  
  // Send message dialog
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  
  // Filtered applications
  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = !searchQuery || 
      (app.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.telegram_username?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    // Редирект только если загрузка завершена И пользователя нет
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Splash screen timeout - longer like APLink (5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchPhrases();
      fetchChatSettings();
      fetchMessages();
      fetchApplications();
      fetchQuestions();
      fetchBotSettings();

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
      // Filter out private chats (positive chat_id typically means private)
      const groupChats = (data || []).filter(chat => chat.chat_id < 0);
      setChatSettings(groupChats);
    }
  };

  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    const { data, error } = await supabase
      .from("telegram_model_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data as ModelApplication[]);
    }
    setIsLoadingApplications(false);
  };

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("bot_questionnaire_questions")
      .select("*")
      .eq("is_active", true)
      .order("question_order", { ascending: true });

    if (!error && data && data.length > 0) {
      setQuestions(data.map(q => ({
        id: q.id,
        step: q.step,
        question: q.question,
        order: q.question_order
      })));
    }
  };

  const fetchBotSettings = async () => {
    const { data } = await supabase
      .from("bot_welcome_settings")
      .select("owner_telegram_chat_id")
      .limit(1)
      .maybeSingle();

    if (data?.owner_telegram_chat_id) {
      setOwnerChatId(data.owner_telegram_chat_id.toString());
    }
  };

  const saveOwnerChatId = async () => {
    if (!ownerChatId.trim()) {
      toast.error("Введите Chat ID");
      return;
    }

    const { data: existing } = await supabase
      .from("bot_welcome_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("bot_welcome_settings")
        .update({ owner_telegram_chat_id: parseInt(ownerChatId) })
        .eq("id", existing.id);

      if (error) {
        toast.error("Ошибка сохранения");
      } else {
        toast.success("Chat ID сохранён! Уведомления будут приходить вам.");
      }
    } else {
      const { error } = await supabase
        .from("bot_welcome_settings")
        .insert({ owner_telegram_chat_id: parseInt(ownerChatId) });

      if (error) {
        toast.error("Ошибка сохранения");
      } else {
        toast.success("Chat ID сохранён!");
      }
    }
  };

  const saveQuestionsToDb = async () => {
    setIsSavingQuestions(true);
    
    try {
      for (const q of questions) {
        await supabase
          .from("bot_questionnaire_questions")
          .update({ 
            question: q.question,
            question_order: q.order 
          })
          .eq("id", q.id);
      }
      toast.success("Вопросы сохранены и синхронизированы с ботом!");
    } catch (error) {
      toast.error("Ошибка сохранения");
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const exportAllApplicationsToWord = async () => {
    if (filteredApplications.length === 0) {
      toast.error("Нет заявок для экспорта");
      return;
    }
    
    toast.info(`Экспортирую ${filteredApplications.length} заявок...`);
    
    for (const app of filteredApplications) {
      await exportApplicationToWord(app);
    }
    
    toast.success(`Экспортировано ${filteredApplications.length} заявок в Word!`);
  };

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("telegram_model_applications")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Ошибка обновления статуса");
    } else {
      toast.success("Статус обновлён");
      fetchApplications();
      if (selectedApplication?.id === id) {
        setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const deleteChatSetting = async (chatId: number) => {
    const { error } = await supabase
      .from("telegram_chat_settings")
      .delete()
      .eq("chat_id", chatId);

    if (error) {
      toast.error("Ошибка удаления чата");
    } else {
      toast.success("Чат удалён");
      setChatSettings(prev => prev.filter(c => c.chat_id !== chatId));
    }
  };

  const setupWebhook = async () => {
    if (!modelBotToken.trim()) {
      toast.error("Введите токен бота");
      return;
    }
    
    setIsSettingWebhook(true);
    try {
      const webhookUrl = "https://ykwiqymksnndugphhgmc.supabase.co/functions/v1/model-bot";
      const response = await fetch(`https://api.telegram.org/bot${modelBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const result = await response.json();
      
      if (result.ok) {
        setWebhookStatus('success');
        toast.success("Webhook успешно настроен!");
      } else {
        setWebhookStatus('error');
        toast.error(`Ошибка: ${result.description}`);
      }
    } catch (error) {
      setWebhookStatus('error');
      toast.error("Ошибка настройки webhook");
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    newQuestions.forEach((q, i) => q.order = i + 1);
    setQuestions(newQuestions);
    toast.success("Порядок изменён");
  };

  const updateQuestionText = (id: string, newText: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: newText } : q));
    setEditingQuestion(null);
    toast.success("Вопрос обновлён");
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

  // Splash Screen - Full APLink Style with video background
  if (showSplash || isLoading || isLoadingData) {
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-[9999] bg-[#030305] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Video background */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={backgroundVideo} type="video/mp4" />
            </video>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-[#030305]/90 to-[#030305]" />
          </motion.div>
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          
          {/* Central glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0.3] }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />

          {/* Logo with rotating rings */}
          <motion.div
            className="relative z-10 mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          >
            {/* Outer glow */}
            <motion.div 
              className="absolute -inset-4 rounded-full bg-primary/20 blur-xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Rotating ring 1 */}
            <motion.div 
              className="absolute -inset-3 rounded-full border-2 border-primary/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            {/* Rotating ring 2 */}
            <motion.div 
              className="absolute -inset-5 rounded-full border border-primary/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            {/* Logo container - scale-150 to fill circle edge-to-edge completely */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-2 ring-primary/50 shadow-[0_0_40px_rgba(6,182,228,0.4)]">
              <video
                src={apolloLogoVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover scale-150"
              />
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            className="relative z-10 text-center px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          >
            {/* Decorative line top */}
            <motion.div
              className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            />
            
            <motion.p
              className="text-xs sm:text-sm text-primary/70 mb-3 tracking-[0.3em] uppercase font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Apollo Production
            </motion.p>
            
            <motion.p
              className="text-xs text-muted-foreground/50 mb-8 italic font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              представляет
            </motion.p>
            
            {/* APOLLO BOT MANAGER - letter by letter */}
            <div className="relative mb-4">
              <motion.div
                className="absolute inset-0 blur-3xl bg-primary/40 rounded-full"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "100%", opacity: [0, 0.6, 0] }}
                transition={{ delay: 1, duration: 2, ease: "easeInOut" }}
              />
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black relative z-10 flex flex-wrap justify-center tracking-tight">
                {"APOLLO PRODUCTION".split("").map((letter, index) => (
                  <motion.span
                    key={index}
                    className={`inline-block relative bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent bg-[length:200%_auto] ${letter === " " ? "w-3" : ""}`}
                    initial={{ 
                      opacity: 0, 
                      x: -20,
                      filter: "blur(8px)",
                    }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      filter: "blur(0px)",
                      backgroundPosition: ["200% 0", "-200% 0"],
                    }}
                    transition={{ 
                      opacity: { delay: 1 + index * 0.05, duration: 0.4 },
                      x: { delay: 1 + index * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                      filter: { delay: 1 + index * 0.05, duration: 0.4 },
                      backgroundPosition: { delay: 2, duration: 4, repeat: Infinity, ease: "linear" },
                    }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                ))}
              </h1>
            </div>
            
            {/* Subtitle */}
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-foreground/90 font-semibold tracking-widest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              Личный кабинет агентства
            </motion.p>

            {/* Decorative line bottom */}
            <motion.div
              className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            />
          </motion.div>

          {/* Loading bar - longer animation for 5 second splash */}
          <motion.div
            className="absolute bottom-12 w-56 h-1 bg-muted/10 rounded-full overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 2, duration: 2.8, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <CustomCursor />
      <motion.div 
        className="min-h-screen bg-[#030305]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background - dark subtle, no center glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header - APLink Style - slightly lighter than background */}
        <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo with glow ring - APLink style */}
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute -inset-1 rounded-full bg-primary/30 blur-md animate-pulse-glow" />
                {/* Rotating ring */}
                <motion.div 
                  className="absolute -inset-1.5 rounded-full border border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                {/* Logo container - scale-150 to fill circle edge-to-edge */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50">
                  <video
                    src={apolloLogoVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover scale-150"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  APOLLO PRODUCTION
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  Личный кабинет агентства
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 cursor-help animate-pulse-glow" style={{ animationDuration: '4s' }}>
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                    </div>
                    <span className="text-xs text-emerald-400 font-medium hidden sm:inline">Online</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-card border-primary/20 text-foreground">
                  <p>Бот активен и обрабатывает сообщения</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </header>

      <main className="container mx-auto px-4 py-6 relative z-10">
        {/* Main Content with Large Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Main Section Tabs - Large Cards Style */}
          <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
            <TabsList className="bg-transparent border-0 p-0 gap-4 w-full grid grid-cols-1 md:grid-cols-4 h-auto">
              <TabsTrigger 
                value="telegram-help" 
                className="group h-auto p-6 rounded-2xl bg-slate-900/50 border-2 border-transparent data-[state=active]:bg-slate-900/80 data-[state=active]:border-[#0088cc] hover:border-[#0088cc]/50 hover:shadow-[0_0_30px_rgba(0,136,204,0.3)] transition-all duration-300 flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-xl bg-[#0088cc]/20 flex items-center justify-center border border-[#0088cc]/40 group-hover:bg-[#0088cc]/30 group-hover:shadow-[0_0_20px_rgba(0,136,204,0.5)] transition-all duration-300">
                  <Bot className="w-8 h-8 text-[#0088cc]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-white">Telegram Bot HELP</p>
                  <p className="text-xs text-slate-400 mt-1">Быстрые фразы • Чаты • История</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-[#0088cc]/30">{phrases.length} фраз</Badge>
                  <Badge variant="outline" className="text-xs border-purple-500/30">{chatSettings.length} чатов</Badge>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="model-application" 
                className="group h-auto p-6 rounded-2xl bg-slate-900/50 border-2 border-transparent data-[state=active]:bg-slate-900/80 data-[state=active]:border-purple-500 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-300 flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40 group-hover:bg-purple-500/30 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300">
                  <ClipboardList className="w-8 h-8 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-white">Анкета моделей</p>
                  <p className="text-xs text-slate-400 mt-1">Заявки • Вопросы • Webhook</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                    {applications.filter(a => a.status === 'pending').length} новых
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-500/30">{applications.length} всего</Badge>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="onlyfans" 
                className="group h-auto p-6 rounded-2xl bg-slate-900/50 border-2 border-transparent data-[state=active]:bg-slate-900/80 data-[state=active]:border-[#00AFF0] hover:border-[#00AFF0]/50 hover:shadow-[0_0_30px_rgba(0,175,240,0.3)] transition-all duration-300 flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-xl bg-[#00AFF0]/20 flex items-center justify-center border border-[#00AFF0]/40 group-hover:bg-[#00AFF0]/30 group-hover:shadow-[0_0_20px_rgba(0,175,240,0.5)] transition-all duration-300 overflow-hidden p-2">
                  <img src={onlyfansLogo} alt="OnlyFans" className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-white">API OnlyMonster</p>
                  <p className="text-xs text-slate-400 mt-1">Управление аккаунтами</p>
                </div>
                <Badge variant="outline" className="text-xs border-[#00AFF0]/30 text-[#00AFF0] mt-2">Coming Soon</Badge>
              </TabsTrigger>

              <TabsTrigger 
                value="pimpbunny" 
                className="group h-auto p-6 rounded-2xl bg-slate-900/50 border-2 border-transparent data-[state=active]:bg-slate-900/80 data-[state=active]:border-pink-500 hover:border-pink-500/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all duration-300 flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/40 group-hover:bg-pink-500/30 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all duration-300 p-2">
                  <img src={pimpbunnyLogo} alt="PimpBunny" className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-white">PimpBunny</p>
                  <p className="text-xs text-slate-400 mt-1">Скоро будет доступен</p>
                </div>
                <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-400 mt-2">Coming Soon</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Telegram Bot HELP Tab */}
            <TabsContent value="telegram-help" className="space-y-6">
              {/* Sub-tabs for Telegram Bot */}
              <Tabs value={subTab} onValueChange={setSubTab} className="space-y-4">
                <TabsList className="bg-slate-800/50 border border-white/5 p-1 gap-1">
                  <TabsTrigger 
                    value="help" 
                    className="text-xs data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    <Command className="w-3 h-3 mr-1" />
                    Справка
                  </TabsTrigger>
                  <TabsTrigger 
                    value="phrases" 
                    className="text-xs data-[state=active]:bg-[#0088cc] data-[state=active]:text-white"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Быстрые фразы
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chats" 
                    className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Настройки чатов
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                  >
                    <History className="w-3 h-3 mr-1" />
                    История
                  </TabsTrigger>
                </TabsList>

            {/* Help Tab */}
            <TabsContent value="help" className="space-y-6">
              <BotCommandsHelp />
            </TabsContent>

            {/* Phrases Tab */}
            <TabsContent value="phrases" className="space-y-6">
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
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
            </motion.div>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteChatSetting(chat.chat_id)}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

              {/* History Sub-Tab */}
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
            </TabsContent>

            {/* Model Application Tab */}
            <TabsContent value="model-application" className="space-y-6">
              {/* Sub-tabs for Model Applications */}
              <Tabs value={modelSubTab} onValueChange={setModelSubTab} className="space-y-4">
                <TabsList className="bg-slate-800/50 border border-white/5 p-1 gap-1">
                  <TabsTrigger 
                    value="stats" 
                    className="text-xs data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Статистика
                  </TabsTrigger>
                  <TabsTrigger 
                    value="funnel" 
                    className="text-xs data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Воронка
                  </TabsTrigger>
                  <TabsTrigger 
                    value="applications" 
                    className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                  >
                    <ClipboardList className="w-3 h-3 mr-1" />
                    Заявки ({applications.filter(a => a.status === 'pending').length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bot-editor" 
                    className="text-xs data-[state=active]:bg-violet-500 data-[state=active]:text-white"
                  >
                    <Bot className="w-3 h-3 mr-1" />
                    Редактор бота
                  </TabsTrigger>
                  <TabsTrigger 
                    value="webhook" 
                    className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                  >
                    <Link className="w-3 h-3 mr-1" />
                    Webhook
                  </TabsTrigger>
                </TabsList>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-4">
                  <ApplicationStats applications={applications} />
                </TabsContent>

                {/* Funnel Tab */}
                <TabsContent value="funnel" className="space-y-4">
                  <ApplicationFunnel />
                </TabsContent>

                {/* Applications List */}
                <TabsContent value="applications" className="space-y-4">
                  <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <ClipboardList className="w-4 h-4 text-white" />
                        </div>
                        Заявки моделей
                        <div className="ml-auto flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportAllApplicationsToWord}
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Экспорт Word
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchApplications}
                          >
                            <RefreshCw className={`w-4 h-4 ${isLoadingApplications ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </CardTitle>
                      
                      {/* Filters */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="relative flex-1 min-w-[200px]">
                          <Input
                            placeholder="Поиск по имени или @username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-800/50 border-white/10 pl-10"
                          />
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/10">
                            <SelectValue placeholder="Статус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            <SelectItem value="pending">⏳ На рассмотрении</SelectItem>
                            <SelectItem value="approved">✅ Одобрены</SelectItem>
                            <SelectItem value="rejected">❌ Отклонены</SelectItem>
                            <SelectItem value="in_progress">📝 Заполняются</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredApplications.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p>{applications.length === 0 ? 'Нет заявок' : 'Заявки не найдены'}</p>
                          <p className="text-xs mt-2">{applications.length === 0 ? 'Заявки появятся здесь после заполнения анкеты' : 'Попробуйте изменить фильтры'}</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {filteredApplications.map((app) => (
                            <div
                              key={app.id}
                              className="p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                              onClick={() => setSelectedApplication(app)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-purple-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{app.full_name || 'Без имени'}</p>
                                    <p className="text-xs text-slate-500">@{app.telegram_username || 'unknown'} • {app.age || '?'} лет</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      app.status === 'pending' ? 'border-yellow-500/50 text-yellow-400' :
                                      app.status === 'approved' ? 'border-emerald-500/50 text-emerald-400' :
                                      app.status === 'rejected' ? 'border-red-500/50 text-red-400' :
                                      'border-slate-500/50 text-slate-400'
                                    }
                                  >
                                    {app.status === 'pending' ? '⏳ На рассмотрении' :
                                     app.status === 'approved' ? '✅ Одобрена' :
                                     app.status === 'rejected' ? '❌ Отклонена' :
                                     app.status === 'in_progress' ? '📝 Заполняется' : app.status}
                                  </Badge>
                                  <Eye className="w-4 h-4 text-slate-500" />
                                </div>
                              </div>
                              {app.desired_income && (
                                <p className="text-xs text-slate-400 mt-2">💰 Желаемый доход: {app.desired_income}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Application Detail Modal */}
                  {selectedApplication && (
                    <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-2">
                            <span>Детали заявки</span>
                            <Badge className={
                              selectedApplication.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              selectedApplication.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                              selectedApplication.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-slate-500/20 text-slate-400'
                            }>
                              {selectedApplication.status === 'pending' ? '⏳ На рассмотрении' :
                               selectedApplication.status === 'approved' ? '✅ Одобрена' :
                               selectedApplication.status === 'rejected' ? '❌ Отклонена' :
                               '📝 Заполняется'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => exportApplicationToWord(selectedApplication as any)}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Word
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedApplication(null)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Имя</span>
                            <span className="text-white font-medium">{selectedApplication.full_name || 'Не указано'}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Возраст</span>
                            <span className="text-white font-medium">{selectedApplication.age || '?'}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Страна</span>
                            <span className="text-white font-medium">{selectedApplication.country || 'Не указана'}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Telegram</span>
                            <span className="text-[#0088cc] font-medium">@{selectedApplication.telegram_username || 'unknown'}</span>
                          </div>
                        </div>

                        {/* Physical */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Рост / Вес</span>
                            <span className="text-white font-medium">{selectedApplication.height || '?'} / {selectedApplication.weight || '?'}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Цвет волос</span>
                            <span className="text-white font-medium">{selectedApplication.hair_color || 'Не указан'}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Желаемый доход</span>
                            <span className="text-emerald-400 font-medium">{selectedApplication.desired_income || 'Не указан'}</span>
                          </div>
                        </div>

                        {/* Platforms & Content */}
                        {(selectedApplication.platforms && selectedApplication.platforms.length > 0) && (
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-2">Платформы</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedApplication.platforms.map((p, i) => (
                                <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-400">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {(selectedApplication.content_preferences && selectedApplication.content_preferences.length > 0) && (
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-2">Готова создавать</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedApplication.content_preferences.map((c, i) => (
                                <Badge key={i} variant="outline" className="border-pink-500/30 text-pink-400">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* About */}
                        {selectedApplication.about_yourself && (
                          <div className="p-4 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-2">О себе</span>
                            <p className="text-white text-sm whitespace-pre-wrap">{selectedApplication.about_yourself}</p>
                          </div>
                        )}

                        {/* TABU */}
                        {(selectedApplication as any).tabu_preferences && (selectedApplication as any).tabu_preferences.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20">
                            <span className="text-red-400 text-xs block mb-2">🚫 ТАБУ (не делает)</span>
                            <div className="flex flex-wrap gap-2">
                              {(selectedApplication as any).tabu_preferences.map((t: string, i: number) => (
                                <Badge key={i} variant="outline" className="border-red-500/30 text-red-400">{t}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional fields */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {(selectedApplication as any).body_params && (
                            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                              <span className="text-slate-500 text-xs block mb-1">Параметры</span>
                              <span className="text-white font-medium">{(selectedApplication as any).body_params}</span>
                            </div>
                          )}
                          {(selectedApplication as any).language_skills && (
                            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                              <span className="text-slate-500 text-xs block mb-1">Языки</span>
                              <span className="text-white font-medium">{(selectedApplication as any).language_skills}</span>
                            </div>
                          )}
                          {(selectedApplication as any).equipment && (
                            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                              <span className="text-slate-500 text-xs block mb-1">Оборудование</span>
                              <span className="text-white font-medium">{(selectedApplication as any).equipment}</span>
                            </div>
                          )}
                          {(selectedApplication as any).time_availability && (
                            <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                              <span className="text-slate-500 text-xs block mb-1">Время</span>
                              <span className="text-white font-medium">{(selectedApplication as any).time_availability}</span>
                            </div>
                          )}
                        </div>

                        {/* Social links */}
                        {(selectedApplication as any).social_media_links && (
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Соцсети</span>
                            <p className="text-[#0088cc] text-sm break-all">{(selectedApplication as any).social_media_links}</p>
                          </div>
                        )}

                        {/* Strong points */}
                        {(selectedApplication as any).strong_points && (
                          <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                            <span className="text-slate-500 text-xs block mb-1">Сильные стороны</span>
                            <p className="text-white text-sm">{(selectedApplication as any).strong_points}</p>
                          </div>
                        )}

                        {/* Photos Gallery */}
                        <ModelPhotosGallery 
                          photos={(selectedApplication as any).portfolio_photos} 
                          modelName={selectedApplication.full_name || selectedApplication.telegram_username || 'model'}
                        />

                        {/* Date */}
                        <div className="text-xs text-slate-500 pt-2 border-t border-white/5">
                          Заявка от {new Date(selectedApplication.created_at).toLocaleDateString('ru-RU', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Одобрить
                          </Button>
                          <Button
                            onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Отклонить
                          </Button>
                          {selectedApplication.telegram_username && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(`https://t.me/${selectedApplication.telegram_username}`, '_blank')}
                              className="border-[#0088cc]/30 hover:bg-[#0088cc]/20"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" /> Telegram
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => setMessageDialogOpen(true)}
                            className="border-purple-500/30 hover:bg-purple-500/20 text-purple-400"
                          >
                            <Send className="w-4 h-4 mr-2" /> Написать
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Send Message Dialog */}
                  {selectedApplication && (
                    <SendMessageDialog
                      open={messageDialogOpen}
                      onOpenChange={setMessageDialogOpen}
                      application={{
                        id: selectedApplication.id,
                        chat_id: (selectedApplication as any).chat_id || selectedApplication.telegram_user_id,
                        telegram_username: selectedApplication.telegram_username,
                        full_name: selectedApplication.full_name
                      }}
                    />
                  )}
                </TabsContent>

                {/* Bot Editor - combined welcome + questions */}
                <TabsContent value="bot-editor" className="space-y-4">
                  <BotEditor />
                </TabsContent>

                {/* Webhook Setup */}
                <TabsContent value="webhook" className="space-y-4">
                  {/* Team Notifications UI Component */}
                  <TeamNotificationSettings 
                    ownerChatId={ownerChatId}
                    onOwnerChatIdChange={setOwnerChatId}
                    onSave={saveOwnerChatId}
                  />

                  {/* Webhook URL & Setup */}
                  <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Link className="w-4 h-4 text-white" />
                        </div>
                        Настройка Webhook
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Webhook URL */}
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-purple-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-purple-300">
                            <Bot className="w-4 h-4" />
                            <span>Webhook URL</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText("https://ykwiqymksnndugphhgmc.supabase.co/functions/v1/model-bot");
                              toast.success("Webhook URL скопирован!");
                            }}
                            className="text-xs border-purple-500/30 hover:bg-purple-500/20"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Копировать
                          </Button>
                        </div>
                        <code className="block text-xs text-purple-400 bg-purple-500/10 p-2 rounded-lg break-all">
                          https://ykwiqymksnndugphhgmc.supabase.co/functions/v1/model-bot
                        </code>
                      </div>

                      {/* Auto Setup */}
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-emerald-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-emerald-300">
                          <Zap className="w-4 h-4" />
                          <span>Автоматическая настройка Webhook</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Вставьте токен бота от @BotFather и нажмите кнопку для автоматической настройки webhook
                        </p>
                        <div className="flex gap-2">
                          <Input
                            value={modelBotToken}
                            onChange={(e) => setModelBotToken(e.target.value)}
                            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                            className="bg-slate-800/50 border-emerald-500/30 font-mono text-sm"
                            type="password"
                          />
                          <Button
                            onClick={setupWebhook}
                            disabled={isSettingWebhook}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            {isSettingWebhook ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Link className="w-4 h-4 mr-2" />
                                Настроить
                              </>
                            )}
                          </Button>
                        </div>
                        {webhookStatus === 'success' && (
                          <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Webhook успешно настроен!
                          </div>
                        )}
                        {webhookStatus === 'error' && (
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Ошибка настройки webhook
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* OnlyFans Tab */}
            <TabsContent value="onlyfans" className="space-y-6">
              <OnlyFansSection />
            </TabsContent>

            {/* PimpBunny Tab */}
            <TabsContent value="pimpbunny" className="space-y-6">
              <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/40 overflow-hidden p-1.5">
                      <img src={pimpbunnyLogo} alt="PimpBunny" className="w-full h-full object-contain" />
                    </div>
                    PimpBunny
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Настройки и управление PimpBunny
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 rounded-xl bg-pink-500/20 flex items-center justify-center border border-pink-500/40 mx-auto mb-4 overflow-hidden p-2">
                      <img src={pimpbunnyLogo} alt="PimpBunny" className="w-full h-full object-contain opacity-50" />
                    </div>
                    <p>Раздел PimpBunny</p>
                    <p className="text-xs mt-2">Функционал будет добавлен позже</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </motion.div>
    </TooltipProvider>
  );
};

export default Dashboard;
