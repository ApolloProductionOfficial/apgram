import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Sparkles } from "lucide-react";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: {
    id: string;
    chat_id: number;
    telegram_username?: string | null;
    full_name?: string | null;
  };
}

const QUICK_MESSAGES = [
  {
    label: "Приветствие",
    text: "👋 Привет! Это Apollo Production. Мы рассмотрели вашу заявку и хотели бы обсудить сотрудничество!"
  },
  {
    label: "Уточнение",
    text: "🤔 Привет! У нас есть несколько вопросов по вашей заявке. Можете уделить минутку?"
  },
  {
    label: "Напоминание",
    text: "📝 Привет! Заметили, что вы начали заполнять анкету, но не закончили. Может чем-то помочь?"
  },
];

export function SendMessageDialog({ open, onOpenChange, application }: SendMessageDialogProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error("Введите сообщение");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-model-message', {
        body: {
          chat_id: application.chat_id,
          message: message.trim()
        }
      });

      if (error) throw error;

      toast.success("Сообщение отправлено!");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Ошибка отправки сообщения");
    } finally {
      setIsSending(false);
    }
  };

  const applyQuickMessage = (text: string) => {
    setMessage(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            Отправить сообщение
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Сообщение для {application.full_name || `@${application.telegram_username}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick messages */}
          <div className="space-y-2">
            <Label className="text-slate-400 text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Быстрые сообщения
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_MESSAGES.map((qm, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickMessage(qm.text)}
                  className="text-xs border-purple-500/30 hover:bg-purple-500/20 text-slate-300"
                >
                  {qm.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Message textarea */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-slate-400 text-xs">
              Текст сообщения
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишите сообщение модели..."
              className="bg-slate-800/50 border-white/10 min-h-[120px] text-white resize-none"
            />
            <p className="text-xs text-slate-500">
              Поддерживается HTML форматирование: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Отмена
          </Button>
          <Button
            onClick={sendMessage}
            disabled={isSending || !message.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}