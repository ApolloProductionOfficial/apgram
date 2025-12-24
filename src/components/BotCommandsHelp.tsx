import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageCircle, Globe, Mic, Zap, FileText, Command, AlertCircle } from "lucide-react";

export const BotCommandsHelp = () => {
  const commands = [
    {
      command: '/start',
      description: 'Запустить бота и показать приветственное сообщение',
      category: 'Основные',
      color: 'bg-[#0088cc]'
    },
    {
      command: '/summary',
      description: 'Получить AI-саммари чата за последние 24 часа',
      category: 'Основные',
      color: 'bg-[#0088cc]'
    },
    {
      command: '/summary_all',
      description: 'Полный отчёт со всеми сообщениями за всё время',
      category: 'Основные',
      color: 'bg-purple-500'
    },
    {
      command: '/p_[название]',
      description: 'Отправить заранее созданную быструю фразу с медиа',
      category: 'Быстрые фразы',
      color: 'bg-emerald-500'
    }
  ];

  const features = [
    {
      icon: Globe,
      title: 'Автоперевод RU↔EN',
      description: 'Автоматический перевод всех сообщений в чате'
    },
    {
      icon: Mic,
      title: 'Голосовые сообщения',
      description: 'Транскрипция и перевод голосовых'
    },
    {
      icon: Zap,
      title: 'Быстрые фразы',
      description: 'Шаблонные ответы с медиафайлами'
    }
  ];

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center">
            <Command className="w-4 h-4 text-white" />
          </div>
          Справка по командам бота
        </CardTitle>
        <CardDescription className="text-slate-400">
          Доступные команды и функции Telegram Bot HELP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Commands List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Команды</h4>
          {commands.map((cmd, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5">
              <code className={`text-xs font-mono text-white ${cmd.color} px-2 py-1 rounded-lg whitespace-nowrap`}>
                {cmd.command}
              </code>
              <div className="flex-1">
                <p className="text-sm text-slate-300">{cmd.description}</p>
                <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-500">
                  {cmd.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Функции</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {features.map((feature, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-800/30 border border-white/5 text-center">
                <feature.icon className="w-6 h-6 text-[#0088cc] mx-auto mb-2" />
                <p className="text-sm font-medium text-white">{feature.title}</p>
                <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20">
          <h4 className="text-sm font-medium text-[#0088cc] mb-2">💡 Советы</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Добавьте бота в групповой чат и напишите /start</li>
            <li>• Используйте /p_название для отправки быстрых фраз</li>
            <li>• Бот автоматически переводит сообщения RU↔EN</li>
            <li>• Голосовые сообщения автоматически транскрибируются</li>
          </ul>
        </div>

        {/* Support Contact */}
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-medium text-yellow-400">Нужна помощь?</h4>
          </div>
          <p className="text-xs text-slate-400">
            Если у вас есть проблемы или вопросы — пишите напрямую владельцу: 
            <a 
              href="https://t.me/Apollo_Produciton" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#0088cc] hover:underline ml-1 font-medium"
            >
              @Apollo_Produciton
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
