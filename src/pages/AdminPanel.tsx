import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, Calendar, Clock, MapPin, Globe, Shield, User, Camera, Save, Trash2, Loader2, BarChart3, Languages, MousePointer, TrendingUp, Eye, Sparkles, Upload, CheckCircle, XCircle, AlertCircle, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CustomCursor from '@/components/CustomCursor';
import AnimatedBackground from '@/components/AnimatedBackground';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import { BotEditor } from '@/components/BotEditor';
import apolloLogo from '@/assets/apollo-logo.mp4';

interface MeetingTranscript {
  id: string;
  room_id: string;
  room_name: string;
  started_at: string;
  ended_at: string | null;
  transcript: string | null;
  summary: string | null;
  key_points: {
    summary?: string;
    keyPoints?: string[];
    actionItems?: string[];
    decisions?: string[];
  } | null;
  participants: string[] | null;
}

interface MeetingParticipant {
  id: string;
  room_id: string;
  user_name: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
}

interface ParticipantGeoData {
  id: string;
  participant_id: string;
  ip_address: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface AnalyticsStats {
  totalPageViews: number;
  totalTranslations: number;
  totalClicks: number;
  totalRoomJoins: number;
  uniqueSessions: number;
  topPages: { path: string; count: number }[];
  recentEvents: { event_type: string; created_at: string; page_path: string; event_data: Record<string, unknown> }[];
  translationsByLanguage: { language: string; count: number }[];
}

interface RegisteredUser {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ModelApplication {
  id: string;
  telegram_user_id: number;
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
  content_preferences: string[] | null;
  social_media_experience: string[] | null;
  social_media_links: string | null;
  equipment: string | null;
  time_availability: string | null;
  desired_income: string | null;
  about_yourself: string | null;
  strong_points: string | null;
  status: string;
  step: string;
  created_at: string;
  completed_at: string | null;
}

interface BotWelcomeSettings {
  id: string;
  welcome_message: string;
  welcome_media_url: string | null;
  welcome_media_type: string;
  owner_contact: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();
  const admin = (t as any).adminPanel || {};
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([]);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [geoData, setGeoData] = useState<Map<string, ParticipantGeoData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcripts' | 'participants' | 'profile' | 'analytics' | 'users' | 'models' | 'help-bot' | 'pimpbunny' | 'bot-editor'>('analytics');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [has2FA, setHas2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Models tab state
  const [modelApplications, setModelApplications] = useState<ModelApplication[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [botWelcomeSettings, setBotWelcomeSettings] = useState<BotWelcomeSettings | null>(null);
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [uploadingWelcomeMedia, setUploadingWelcomeMedia] = useState(false);
  const welcomeMediaInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      const [transcriptsRes, participantsRes, geoDataRes, profileRes] = await Promise.all([
        supabase
          .from('meeting_transcripts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('meeting_participants')
          .select('*')
          .order('joined_at', { ascending: false }),
        supabase
          .from('participant_geo_data')
          .select('*'),
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);
      
      if (transcriptsRes.data) {
        setTranscripts(transcriptsRes.data as MeetingTranscript[]);
      }
      if (participantsRes.data) {
        setParticipants(participantsRes.data as MeetingParticipant[]);
      }
      if (geoDataRes.data) {
        const geoMap = new Map<string, ParticipantGeoData>();
        geoDataRes.data.forEach((geo: ParticipantGeoData) => {
          geoMap.set(geo.participant_id, geo);
        });
        setGeoData(geoMap);
      }
      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        setDisplayName(profileRes.data.display_name || '');
        setUsername(profileRes.data.username || '');
      }
      
      setLoading(false);
    };
    
    fetchData();
    
    // Subscribe to realtime updates for participants
    const channel = supabase
      .channel('admin-participants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_participants' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [payload.new as MeetingParticipant, ...prev]);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  // Load analytics data
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'analytics') return;
    
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const { data: analyticsData, error } = await supabase
          .from('site_analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) throw error;

        const { count: translationCount } = await supabase
          .from('translation_history')
          .select('*', { count: 'exact', head: true });

        const events = analyticsData || [];
        
        const totalPageViews = events.filter(e => e.event_type === 'page_view').length;
        const totalTranslations = (translationCount || 0) + events.filter(e => e.event_type === 'translation_completed').length;
        const totalClicks = events.filter(e => e.event_type === 'button_click').length;
        const totalRoomJoins = events.filter(e => e.event_type === 'room_joined').length;
        const uniqueSessions = new Set(events.map(e => e.session_id)).size;

        const pageCount = new Map<string, number>();
        events.filter(e => e.event_type === 'page_view').forEach(e => {
          const path = e.page_path || '/';
          pageCount.set(path, (pageCount.get(path) || 0) + 1);
        });
        const topPages = Array.from(pageCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([path, count]) => ({ path, count }));

        const langCount = new Map<string, number>();
        events.filter(e => e.event_type === 'translation_completed').forEach(e => {
          const data = e.event_data as Record<string, unknown>;
          const lang = (data?.target_language as string) || 'unknown';
          langCount.set(lang, (langCount.get(lang) || 0) + 1);
        });
        const translationsByLanguage = Array.from(langCount.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([language, count]) => ({ language, count }));

        const recentEvents = events.slice(0, 50).map(e => ({
          event_type: e.event_type,
          created_at: e.created_at,
          page_path: e.page_path || '/',
          event_data: (e.event_data || {}) as Record<string, unknown>,
        }));

        setAnalyticsStats({
          totalPageViews,
          totalTranslations,
          totalClicks,
          totalRoomJoins,
          uniqueSessions,
          topPages,
          recentEvents,
          translationsByLanguage,
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error(admin.loadAnalyticsError || 'Не удалось загрузить аналитику');
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [user, isAdmin, activeTab]);

  // Load registered users
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'users') return;
    
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRegisteredUsers(data || []);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error(admin.loadUsersError || 'Не удалось загрузить пользователей');
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [user, isAdmin, activeTab]);

  // Load model applications and welcome settings
  useEffect(() => {
    if (!user || !isAdmin || activeTab !== 'models') return;
    
    const loadModelsData = async () => {
      setModelsLoading(true);
      try {
        const [applicationsRes, welcomeRes] = await Promise.all([
          supabase
            .from('telegram_model_applications')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('bot_welcome_settings')
            .select('*')
            .limit(1)
            .single()
        ]);

        if (applicationsRes.data) {
          setModelApplications(applicationsRes.data as ModelApplication[]);
        }
        if (welcomeRes.data) {
          setBotWelcomeSettings(welcomeRes.data as BotWelcomeSettings);
        }
      } catch (error) {
        console.error('Error loading models data:', error);
      } finally {
        setModelsLoading(false);
      }
    };

    loadModelsData();
  }, [user, isAdmin, activeTab]);

  // Check if user has 2FA enabled
  useEffect(() => {
    if (!user) return;
    
    const check2FAStatus = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp && data.totp.length > 0) {
        setHas2FA(true);
      } else {
        setHas2FA(false);
      }
    };
    
    check2FAStatus();
  }, [user]);

  const disable2FA = async () => {
    setDisabling2FA(true);
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      
      if (factorsData?.totp?.[0]) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factorsData.totp[0].id,
        });
        
        if (error) throw error;
        
        setHas2FA(false);
        toast.success(admin.twoFADisabled || '2FA отключена');
      }
    } catch (err: any) {
      toast.error(err.message || admin.twoFADisableError || 'Не удалось отключить 2FA');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    
    try {
      if (profile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            username: username,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: displayName,
            username: username
          });
        
        if (error) throw error;
      }
      
      toast.success(admin.profileSaved || 'Профиль сохранён');
    } catch (error: any) {
      toast.error((admin.profileSaveError || 'Ошибка сохранения:') + ' ' + error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error(admin.selectImage || 'Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(admin.maxFileSize || 'Максимальный размер файла 2MB');
      return;
    }

    setUploadingAvatar(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error(admin.avatarUploadError || 'Не удалось загрузить аватар');
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl })
      .eq('user_id', user.id);

    if (updateError) {
      toast.error(admin.avatarUpdateError || 'Не удалось обновить профиль');
    } else {
      setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
      toast.success(admin.avatarUpdated || 'Аватар обновлён');
    }

    setUploadingAvatar(false);
  };

  const handleSaveWelcomeSettings = async () => {
    if (!botWelcomeSettings) return;
    setSavingWelcome(true);
    
    try {
      const { error } = await supabase
        .from('bot_welcome_settings')
        .update({
          welcome_message: botWelcomeSettings.welcome_message,
          welcome_media_url: botWelcomeSettings.welcome_media_url,
          welcome_media_type: botWelcomeSettings.welcome_media_type,
          owner_contact: botWelcomeSettings.owner_contact
        })
        .eq('id', botWelcomeSettings.id);
      
      if (error) throw error;
      toast.success('Настройки приветствия сохранены');
    } catch (error: any) {
      toast.error('Ошибка сохранения: ' + error.message);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleWelcomeMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const isGif = file.type === 'image/gif';
    
    if (!isVideo && !isImage) {
      toast.error('Пожалуйста, выберите видео или изображение');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Максимальный размер файла 50MB');
      return;
    }

    setUploadingWelcomeMedia(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `welcome-media.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('bot-media')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Не удалось загрузить медиа');
      setUploadingWelcomeMedia(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('bot-media')
      .getPublicUrl(fileName);

    const mediaType = isGif ? 'animation' : isVideo ? 'video' : 'photo';
    
    setBotWelcomeSettings(prev => prev ? {
      ...prev,
      welcome_media_url: `${urlData.publicUrl}?t=${Date.now()}`,
      welcome_media_type: mediaType
    } : null);

    toast.success('Медиа загружено');
    setUploadingWelcomeMedia(false);
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('telegram_model_applications')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      setModelApplications(prev => 
        prev.map(app => app.id === id ? { ...app, status } : app)
      );
      toast.success(`Статус изменён на: ${status}`);
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCountryFlag = (countryCode: string | null) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />На рассмотрении</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" />Одобрена</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-500"><XCircle className="w-3 h-3 mr-1" />Отклонена</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Заполняется</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cursor-none">
      <CustomCursor />
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <video 
                src={apolloLogo} 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-8 h-8 object-cover rounded-full"
              />
              <span className="font-semibold text-primary">APOLLO</span>
              <span className="font-semibold">PRODUCTION</span>
            </Button>
            <Badge variant="secondary" className="gap-1 bg-primary/20 text-primary border-primary/30">
              <Shield className="w-3 h-3" />
              Личный кабинет агентства
            </Badge>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('analytics')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {admin.analytics || 'Статистика'}
            </Button>
            <Button
              variant={activeTab === 'help-bot' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('help-bot')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              Telegram Bot HELP
            </Button>
            <Button
              variant={activeTab === 'models' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('models')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Анкета моделей
            </Button>
            <Button
              variant={activeTab === 'bot-editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('bot-editor')}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              Редактор бота
            </Button>
            <Button
              variant={activeTab === 'pimpbunny' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('pimpbunny')}
              className="gap-2 text-pink-400 border-pink-400/30 hover:bg-pink-400/10"
            >
              <Sparkles className="w-4 h-4" />
              PimpBunny
            </Button>
            <Button
              variant={activeTab === 'transcripts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('transcripts')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              {admin.transcripts || 'Записи'}
            </Button>
            <Button
              variant={activeTab === 'participants' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('participants')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              {admin.ipChecker || 'IP-чекер'}
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              {admin.users || 'Пользователи'}
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('profile')}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              {admin.profile || 'Профиль'}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : activeTab === 'help-bot' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              Telegram Bot HELP
            </h1>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Настройки бота-помощника</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Здесь будут настройки чатов, быстрые фразы и другие функции бота HELP.</p>
                <p className="text-sm text-muted-foreground mt-2">Бот для добавления в группы: переводчик, саммари, быстрые фразы.</p>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'pimpbunny' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-pink-400">
              <Sparkles className="w-6 h-6" />
              PimpBunny
            </h1>
            <Card className="bg-card/50 backdrop-blur-sm border-pink-500/20">
              <CardHeader>
                <CardTitle className="text-pink-400">Раздел в разработке</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Функционал PimpBunny будет добавлен позже.</p>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'bot-editor' ? (
          <BotEditor />
        ) : activeTab === 'models' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Управление моделями
            </h1>
            
            {modelsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Welcome Settings */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Приветственное сообщение бота
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {botWelcomeSettings && (
                      <>
                        <div className="space-y-2">
                          <Label>Приветственный текст (HTML)</Label>
                          <Textarea
                            value={botWelcomeSettings.welcome_message}
                            onChange={(e) => setBotWelcomeSettings(prev => prev ? { ...prev, welcome_message: e.target.value } : null)}
                            className="min-h-[200px] font-mono text-sm"
                            placeholder="Приветственное сообщение..."
                          />
                          <p className="text-xs text-muted-foreground">Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Медиа (видео/GIF/фото)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={botWelcomeSettings.welcome_media_url || ''}
                              onChange={(e) => setBotWelcomeSettings(prev => prev ? { ...prev, welcome_media_url: e.target.value } : null)}
                              placeholder="URL медиа..."
                              className="flex-1"
                            />
                            <input
                              type="file"
                              accept="video/*,image/*"
                              className="hidden"
                              ref={welcomeMediaInputRef}
                              onChange={handleWelcomeMediaUpload}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => welcomeMediaInputRef.current?.click()}
                              disabled={uploadingWelcomeMedia}
                            >
                              {uploadingWelcomeMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Тип медиа</Label>
                          <Select
                            value={botWelcomeSettings.welcome_media_type}
                            onValueChange={(value) => setBotWelcomeSettings(prev => prev ? { ...prev, welcome_media_type: value } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Видео</SelectItem>
                              <SelectItem value="animation">GIF/Анимация</SelectItem>
                              <SelectItem value="photo">Фото</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Контакт владельца</Label>
                          <Input
                            value={botWelcomeSettings.owner_contact}
                            onChange={(e) => setBotWelcomeSettings(prev => prev ? { ...prev, owner_contact: e.target.value } : null)}
                            placeholder="@username или ссылка"
                          />
                          <p className="text-xs text-muted-foreground">Отображается как контакт для связи</p>
                        </div>
                        
                        <Button 
                          onClick={handleSaveWelcomeSettings}
                          disabled={savingWelcome}
                          className="w-full"
                        >
                          {savingWelcome ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Сохранить настройки
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {/* Applications Stats */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Статистика анкет
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-2xl font-bold text-blue-500">{modelApplications.filter(a => a.status === 'in_progress').length}</p>
                        <p className="text-sm text-muted-foreground">Заполняются</p>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-2xl font-bold text-yellow-500">{modelApplications.filter(a => a.status === 'pending').length}</p>
                        <p className="text-sm text-muted-foreground">На рассмотрении</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-2xl font-bold text-green-500">{modelApplications.filter(a => a.status === 'approved').length}</p>
                        <p className="text-sm text-muted-foreground">Одобрено</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-2xl font-bold text-red-500">{modelApplications.filter(a => a.status === 'rejected').length}</p>
                        <p className="text-sm text-muted-foreground">Отклонено</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Applications List */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Все анкеты ({modelApplications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {modelApplications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Анкет пока нет</p>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {modelApplications.map((app) => (
                      <AccordionItem key={app.id} value={app.id} className="border border-border/50 rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-left">
                              <p className="font-medium">{app.full_name || 'Без имени'}</p>
                              <p className="text-xs text-muted-foreground">@{app.telegram_username || 'нет username'}</p>
                            </div>
                            {getStatusBadge(app.status)}
                            <span className="text-xs text-muted-foreground ml-auto mr-4">
                              {formatDate(app.created_at)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid md:grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2 text-sm">
                              <p><strong>Возраст:</strong> {app.age || 'Не указан'}</p>
                              <p><strong>Страна:</strong> {app.country || 'Не указана'}</p>
                              <p><strong>Рост/Вес:</strong> {app.height || '-'} / {app.weight || '-'}</p>
                              <p><strong>Параметры:</strong> {app.body_params || '-'}</p>
                              <p><strong>Волосы:</strong> {app.hair_color || '-'}</p>
                              <p><strong>Языки:</strong> {app.language_skills || '-'}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p><strong>Платформы:</strong> {app.platforms?.join(', ') || '-'}</p>
                              <p><strong>Контент:</strong> {app.content_preferences?.join(', ') || '-'}</p>
                              <p><strong>Опыт:</strong> {app.social_media_experience?.join(', ') || '-'}</p>
                              <p><strong>Оборудование:</strong> {app.equipment || '-'}</p>
                              <p><strong>Время:</strong> {app.time_availability || '-'}</p>
                              <p><strong>Желаемый доход:</strong> {app.desired_income || '-'}</p>
                            </div>
                            <div className="md:col-span-2 space-y-2 text-sm">
                              <p><strong>Соцсети:</strong> {app.social_media_links || '-'}</p>
                              <p><strong>О себе:</strong> {app.about_yourself || '-'}</p>
                              <p><strong>Сильные стороны:</strong> {app.strong_points || '-'}</p>
                            </div>
                            <div className="md:col-span-2 flex gap-2 pt-4 border-t border-border/50">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20"
                                onClick={() => updateApplicationStatus(app.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Одобрить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20"
                                onClick={() => updateApplicationStatus(app.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Отклонить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`https://t.me/${app.telegram_username}`, '_blank')}
                                disabled={!app.telegram_username}
                              >
                                Написать в Telegram
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              {admin.siteAnalytics || 'Аналитика сайта'}
            </h1>
            
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : analyticsStats ? (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Eye className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analyticsStats.totalPageViews}</p>
                          <p className="text-xs text-muted-foreground">{admin.pageViews || 'Просмотров'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Languages className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analyticsStats.totalTranslations}</p>
                          <p className="text-xs text-muted-foreground">{admin.translations || 'Переводов'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <MousePointer className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analyticsStats.totalClicks}</p>
                          <p className="text-xs text-muted-foreground">Кликов</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analyticsStats.totalRoomJoins}</p>
                          <p className="text-xs text-muted-foreground">Входов в комнаты</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          <TrendingUp className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analyticsStats.uniqueSessions}</p>
                          <p className="text-xs text-muted-foreground">Сессий</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top pages */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Популярные страницы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsStats.topPages.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Нет данных</p>
                      ) : (
                        <div className="space-y-2">
                          {analyticsStats.topPages.map((page, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1 mr-4">{page.path}</span>
                              <Badge variant="secondary">{page.count}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Translations by language */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Languages className="w-5 h-5 text-primary" />
                        Переводы по языкам
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsStats.translationsByLanguage.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Нет данных о переводах</p>
                      ) : (
                        <div className="space-y-2">
                          {analyticsStats.translationsByLanguage.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="uppercase font-mono">{item.language}</span>
                              <Badge variant="secondary">{item.count}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent events */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Последние события
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {analyticsStats.recentEvents.map((event, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm border-b border-border/30 pb-2 last:border-0">
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {event.event_type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-muted-foreground truncate flex-1">{event.page_path}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(event.created_at).toLocaleString('ru-RU')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Нет данных аналитики</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : activeTab === 'transcripts' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              {admin.meetingRecords || 'Записи встреч'}
            </h1>
            
            {transcripts.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{admin.noRecords || 'Записей пока нет'}</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {transcripts.map((transcript) => (
                  <AccordionItem key={transcript.id} value={transcript.id} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 flex-1">
                        <Badge variant="outline">{transcript.room_name}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(transcript.started_at)}
                        </span>
                        {transcript.summary && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                            AI Summary
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {transcript.summary && (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-primary" />
                              {admin.summary || 'Краткое содержание'}
                            </h4>
                            <p className="text-sm">{transcript.summary}</p>
                          </div>
                        )}
                        
                        {transcript.key_points?.keyPoints && transcript.key_points.keyPoints.length > 0 && (
                          <div className="p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-semibold mb-2">{admin.keyPoints || 'Ключевые моменты'}</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {transcript.key_points.keyPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {transcript.transcript && (
                          <div className="p-4 rounded-lg bg-muted/50">
                            <h4 className="font-semibold mb-2">{admin.transcript || 'Транскрипт'}</h4>
                            <p className="text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                              {transcript.transcript}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        ) : activeTab === 'participants' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              {admin.ipChecker || 'IP-чекер участников'}
            </h1>
            
            {participants.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{admin.noParticipants || 'Участников пока нет'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {participants.map((participant) => {
                  const geo = geoData.get(participant.id);
                  return (
                    <Card key={participant.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {participant.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.user_name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(participant.joined_at)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{participant.room_id}</Badge>
                            
                            {geo ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">{getCountryFlag(geo.country_code)}</span>
                                <div>
                                  <p className="font-medium">{geo.city}, {geo.country}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {geo.ip_address}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">{admin.noGeoData || 'Нет гео-данных'}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              {admin.registeredUsers || 'Зарегистрированные пользователи'}
            </h1>
            
            {usersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : registeredUsers.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{admin.noUsers || 'Пользователей пока нет'}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {registeredUsers.map((regUser) => (
                  <Card key={regUser.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={regUser.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(regUser.display_name || regUser.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{regUser.display_name || 'Без имени'}</p>
                          {regUser.username && (
                            <p className="text-sm text-muted-foreground">@{regUser.username}</p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(regUser.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              {admin.profileSettings || 'Настройки профиля'}
            </h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">{admin.personalInfo || 'Личная информация'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <Avatar 
                        className="h-24 w-24 cursor-pointer ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/50"
                        onClick={handleAvatarClick}
                      >
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {(displayName || username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">{admin.displayName || 'Отображаемое имя'}</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={admin.enterName || 'Введите имя'}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">{admin.username || 'Username'}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={admin.enterUsername || 'Введите username'}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full"
                    >
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {admin.save || 'Сохранить'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {admin.twoFactorAuth || 'Двухфакторная аутентификация'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {has2FA ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-500">
                        <Shield className="w-5 h-5" />
                        <span>{admin.twoFAEnabled || '2FA включена'}</span>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={disable2FA}
                        disabled={disabling2FA}
                        className="w-full"
                      >
                        {disabling2FA ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {admin.disable2FA || 'Отключить 2FA'}
                      </Button>
                    </div>
                  ) : show2FASetup ? (
                    <TwoFactorSetup 
                      isOpen={show2FASetup}
                      onClose={() => setShow2FASetup(false)}
                      onSuccess={() => {
                        setShow2FASetup(false);
                        setHas2FA(true);
                      }} 
                    />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {admin.twoFADescription || 'Добавьте дополнительный уровень безопасности к вашему аккаунту'}
                      </p>
                      <Button onClick={() => setShow2FASetup(true)} className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        {admin.enable2FA || 'Настроить 2FA'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      {/* TwoFactorSetup Dialog - rendered outside of conditional */}
      <TwoFactorSetup 
        isOpen={show2FASetup}
        onClose={() => setShow2FASetup(false)}
        onSuccess={() => {
          setShow2FASetup(false);
          setHas2FA(true);
        }} 
      />
    </div>
  );
};

export default AdminPanel;
