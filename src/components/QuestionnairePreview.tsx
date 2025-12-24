import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Bot, MessageCircle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  step: string;
  question: string;
  description: string | null;
  question_order: number;
  question_type: string | null;
  options: any;
  is_active: boolean | null;
}

// Типы контента как в боте
const CONTENT_TYPES = [
  { id: 'solo', name: 'Соло контент', emoji: '👤' },
  { id: 'bg', name: 'B/G (с партнёром)', emoji: '👫' },
  { id: 'gg', name: 'G/G (лесби)', emoji: '👩‍❤️‍👩' },
  { id: 'fetish', name: 'Фетиш контент', emoji: '🎭' },
  { id: 'webcam', name: 'Вебкам трансляции', emoji: '📺' },
  { id: 'chat', name: 'Только чат/общение', emoji: '💬' },
];

const COUNTRIES = [
  { id: 'ru', name: '🇷🇺 Россия' },
  { id: 'ua', name: '🇺🇦 Украина' },
  { id: 'by', name: '🇧🇾 Беларусь' },
  { id: 'kz', name: '🇰🇿 Казахстан' },
  { id: 'ge', name: '🇬🇪 Грузия' },
  { id: 'other', name: '🌍 Другая' },
];

const HAIR_COLORS = [
  { id: 'blonde', name: '👱‍♀️ Блонд' },
  { id: 'brunette', name: '👩 Брюнетка' },
  { id: 'redhead', name: '👩‍🦰 Рыжая' },
  { id: 'black', name: '🖤 Чёрные' },
  { id: 'other', name: '🎨 Другой' },
];

export function QuestionnairePreview() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bot_questionnaire_questions")
      .select("*")
      .eq("is_active", true)
      .order("question_order", { ascending: true });

    if (!error && data) {
      setQuestions(data);
    }
    setIsLoading(false);
  };

  const currentQuestion = questions[currentStep];

  const getOptionsForStep = (step: string, options: any) => {
    // Если есть сохранённые опции в базе
    if (options && Array.isArray(options) && options.length > 0) {
      return options;
    }
    
    // Иначе используем стандартные опции
    switch (step) {
      case 'country':
        return COUNTRIES;
      case 'hair_color':
        return HAIR_COLORS;
      case 'content_types':
        return CONTENT_TYPES;
      default:
        return null;
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    const options = getOptionsForStep(currentQuestion.step, currentQuestion.options);
    const questionType = currentQuestion.question_type || 'text';

    return (
      <div className="space-y-4">
        {/* Сообщение бота */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="bg-slate-800 rounded-2xl rounded-tl-md p-4 max-w-[90%]">
              <p className="text-sm text-white whitespace-pre-wrap">
                <span className="text-purple-400 font-medium">
                  [{currentStep + 1}/{questions.length}]
                </span>
                {"\n\n"}
                {currentQuestion.question}
              </p>
              {currentQuestion.description && (
                <p className="text-xs text-slate-400 mt-2 italic">
                  💡 {currentQuestion.description}
                </p>
              )}
            </div>
            
            {/* Кнопки если есть опции */}
            {options && questionType !== 'text' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {options.slice(0, 6).map((option: any, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-slate-800/50 border-purple-500/30 hover:bg-purple-500/20 text-white"
                  >
                    {option.emoji || ''} {option.name || option.label || option}
                  </Button>
                ))}
                {options.length > 6 && (
                  <Badge variant="outline" className="text-xs border-slate-500/30">
                    +{options.length - 6} ещё
                  </Badge>
                )}
              </div>
            )}
            
            {/* Индикатор типа ввода */}
            {questionType === 'text' && (
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <MessageCircle className="w-3 h-3" />
                <span>Ожидается текстовый ответ</span>
              </div>
            )}
            
            {questionType === 'multi_select' && (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
                <span>✓ Можно выбрать несколько вариантов</span>
              </div>
            )}
          </div>
        </div>

        {/* Пример ответа пользователя */}
        <div className="flex gap-3 justify-end">
          <div className="bg-purple-600/30 rounded-2xl rounded-br-md p-3 max-w-[70%] border border-purple-500/30">
            <p className="text-xs text-slate-400 italic">
              {questionType === 'text' ? '📝 Здесь будет ответ пользователя...' : '👆 Пользователь нажмёт на кнопку'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-white/5">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Загрузка вопросов...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            Предпросмотр анкеты в боте
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCurrentStep(0); fetchQuestions(); }}
            className="border-purple-500/30 hover:bg-purple-500/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Сначала
          </Button>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Так анкета выглядит для моделей в Telegram боте
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Telegram-like preview */}
        <div className="bg-[#17212b] rounded-2xl p-4 min-h-[300px] border border-slate-700">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Apollo Model Bot</p>
              <p className="text-xs text-emerald-400">online</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[250px] pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderQuestionContent()}
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Вопрос {currentStep + 1} из {questions.length}</span>
            <span>{currentQuestion?.step}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1 border-slate-600"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Button
            onClick={() => setCurrentStep(Math.min(questions.length - 1, currentStep + 1))}
            disabled={currentStep >= questions.length - 1}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Далее
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Quick jump */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {questions.map((q, idx) => (
            <Button
              key={q.id}
              variant={idx === currentStep ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentStep(idx)}
              className={`w-8 h-8 p-0 text-xs ${
                idx === currentStep 
                  ? 'bg-purple-500 text-white' 
                  : 'border-slate-600 hover:bg-slate-800'
              }`}
            >
              {idx + 1}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
