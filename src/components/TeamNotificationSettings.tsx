import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell, 
  Plus, 
  Trash2, 
  Save, 
  Users,
  CheckCircle,
  User,
  AtSign
} from "lucide-react";

interface TeamMember {
  chatId: number;
  username?: string;
}

interface TeamNotificationSettingsProps {
  ownerChatId: string;
  onOwnerChatIdChange: (id: string) => void;
  onSave: () => void;
}

export function TeamNotificationSettings({ 
  ownerChatId, 
  onOwnerChatIdChange,
  onSave 
}: TeamNotificationSettingsProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newTeamChatId, setNewTeamChatId] = useState("");
  const [newTeamUsername, setNewTeamUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from("bot_welcome_settings")
      .select("notification_chat_ids")
      .limit(1)
      .maybeSingle();

    if (data?.notification_chat_ids) {
      // Пока usernames хранятся локально, позже можно добавить jsonb колонку
      const members = (data.notification_chat_ids as number[]).map((chatId: number) => ({
        chatId,
        username: undefined
      }));
      setTeamMembers(members);
    }
  };

  const saveTeamMembers = async (members: TeamMember[]) => {
    setIsLoading(true);
    
    const chatIds = members.map(m => m.chatId);

    const { data: existing } = await supabase
      .from("bot_welcome_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("bot_welcome_settings")
        .update({ 
          notification_chat_ids: chatIds
        })
        .eq("id", existing.id);

      if (error) {
        console.error('Save error:', error);
        toast.error("Ошибка сохранения");
      } else {
        setTeamMembers(members);
        toast.success("Список команды обновлён!");
      }
    } else {
      const { error } = await supabase
        .from("bot_welcome_settings")
        .insert({ 
          notification_chat_ids: chatIds
        });

      if (error) {
        console.error('Insert error:', error);
        toast.error("Ошибка сохранения");
      } else {
        setTeamMembers(members);
        toast.success("Список команды сохранён!");
      }
    }
    
    setIsLoading(false);
  };

  const addTeamMember = () => {
    if (!newTeamChatId.trim()) {
      toast.error("Введите Chat ID");
      return;
    }

    const chatId = parseInt(newTeamChatId);
    if (isNaN(chatId)) {
      toast.error("Chat ID должен быть числом");
      return;
    }

    if (teamMembers.some(m => m.chatId === chatId)) {
      toast.error("Этот Chat ID уже добавлен");
      return;
    }

    const newMember: TeamMember = {
      chatId,
      username: newTeamUsername.trim() ? newTeamUsername.trim().replace('@', '') : undefined
    };

    const newMembers = [...teamMembers, newMember];
    saveTeamMembers(newMembers);
    setNewTeamChatId("");
    setNewTeamUsername("");
  };

  const removeTeamMember = (chatId: number) => {
    const newMembers = teamMembers.filter(m => m.chatId !== chatId);
    saveTeamMembers(newMembers);
  };

  const handleOwnerSave = async () => {
    if (!ownerChatId.trim()) {
      toast.error("Введите Chat ID");
      return;
    }
    
    setIsSaving(true);
    try {
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
          console.error('Save owner error:', error);
          toast.error("Ошибка сохранения");
        } else {
          toast.success("Chat ID сохранён! Уведомления будут приходить вам.");
        }
      } else {
        const { error } = await supabase
          .from("bot_welcome_settings")
          .insert({ owner_telegram_chat_id: parseInt(ownerChatId) });

        if (error) {
          console.error('Insert owner error:', error);
          toast.error("Ошибка сохранения");
        } else {
          toast.success("Chat ID сохранён!");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          Уведомления о заявках
        </CardTitle>
        <CardDescription className="text-slate-400">
          Настройте кому приходят уведомления о новых заявках моделей
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner Chat ID */}
        <div className="p-4 rounded-xl bg-slate-800/30 border border-yellow-500/20 space-y-3">
          <div className="flex items-center gap-2 text-sm text-yellow-300">
            <User className="w-4 h-4" />
            <span>Владелец (основной)</span>
            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Обязательно</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Ваш Telegram Chat ID. Узнать можно у @userinfobot
          </p>
          <div className="flex gap-2">
            <Input
              value={ownerChatId}
              onChange={(e) => onOwnerChatIdChange(e.target.value)}
              placeholder="123456789"
              className="bg-slate-800/50 border-yellow-500/30 font-mono text-sm"
              type="number"
            />
            <Button
              onClick={handleOwnerSave}
              disabled={isSaving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>
          {ownerChatId && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Chat ID настроен
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="p-4 rounded-xl bg-slate-800/30 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <Users className="w-4 h-4" />
              <span>Команда (дополнительно)</span>
              <Badge className="bg-blue-500/20 text-blue-400 text-xs">{teamMembers.length}</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Добавьте Chat ID членов команды для получения уведомлений
          </p>
          
          {/* Add new team member */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newTeamChatId}
                onChange={(e) => setNewTeamChatId(e.target.value)}
                placeholder="Chat ID члена команды"
                className="bg-slate-800/50 border-blue-500/30 font-mono text-sm"
                type="number"
              />
              <Input
                value={newTeamUsername}
                onChange={(e) => setNewTeamUsername(e.target.value)}
                placeholder="@username (опционально)"
                className="bg-slate-800/50 border-blue-500/30 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
              />
            </div>
            <Button
              onClick={addTeamMember}
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить члена команды
            </Button>
          </div>

          {/* Team members list */}
          {teamMembers.length > 0 && (
            <div className="space-y-2 mt-3">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.chatId}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-400 font-medium">
                      {index + 1}
                    </div>
                    <div>
                      {member.username && (
                        <div className="flex items-center gap-1 text-sm text-white">
                          <AtSign className="w-3 h-3 text-blue-400" />
                          <span>{member.username}</span>
                        </div>
                      )}
                      <code className="text-xs font-mono text-slate-400">{member.chatId}</code>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(member.chatId)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {teamMembers.length === 0 && (
            <p className="text-xs text-slate-500 italic">
              Пока не добавлено ни одного члена команды
            </p>
          )}
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-slate-800/20 border border-white/5">
          <p className="text-xs text-slate-500">
            💡 <strong className="text-slate-400">Как это работает:</strong> При новой заявке уведомление получат владелец и все члены команды. 
            Каждый сможет одобрить или отклонить заявку прямо в Telegram.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
