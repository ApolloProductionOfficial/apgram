import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit3, Save, ChevronUp, ChevronDown, Plus, Trash2, RefreshCw, 
  MessageSquare, ListChecks, Image, Type, GripVertical, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuestionOption {
  id?: string;
  name?: string;
  emoji?: string;
}

interface Question {
  id: string;
  step: string;
  question: string;
  question_order: number;
  question_type: string | null;
  options: any;
  is_active: boolean;
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Текстовый ответ', icon: Type },
  { value: 'buttons', label: 'Кнопки выбора', icon: MessageSquare },
  { value: 'multi_select', label: 'Множественный выбор', icon: ListChecks },
  { value: 'photos', label: 'Загрузка фото', icon: Image },
];

export function QuestionsEditor() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOptionsId, setEditingOptionsId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bot_questionnaire_questions")
      .select("*")
      .order("question_order", { ascending: true });

    if (error) {
      toast.error("Ошибка загрузки вопросов");
    } else {
      setQuestions(data || []);
    }
    setIsLoading(false);
  };

  const saveQuestions = async () => {
    setIsSaving(true);
    try {
      for (const q of questions) {
        await supabase
          .from("bot_questionnaire_questions")
          .update({
            question: q.question,
            question_order: q.question_order,
            question_type: q.question_type,
            options: q.options,
            is_active: q.is_active
          })
          .eq("id", q.id);
      }
      toast.success("Вопросы сохранены и синхронизированы с ботом!");
    } catch (error) {
      toast.error("Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (swapIndex < 0 || swapIndex >= newQuestions.length) return;
    
    const tempOrder = newQuestions[index].question_order;
    newQuestions[index].question_order = newQuestions[swapIndex].question_order;
    newQuestions[swapIndex].question_order = tempOrder;
    
    newQuestions.sort((a, b) => a.question_order - b.question_order);
    setQuestions(newQuestions);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const getOptions = (q: Question): string[] => {
    if (!q.options) return [];
    if (Array.isArray(q.options)) {
      if (typeof q.options[0] === 'string') {
        return q.options;
      }
      return q.options.map((o: QuestionOption) => `${o.emoji || ''} ${o.name || o.id || ''}`);
    }
    return [];
  };

  const addOption = (questionId: string) => {
    if (!newOption.trim()) return;
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    let newOptions: any[];
    
    if (question.question_type === 'multi_select') {
      const id = newOption.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const existingOptions = Array.isArray(question.options) ? question.options : [];
      newOptions = [...existingOptions, { id, name: newOption, emoji: '✅' }];
    } else {
      const existingOptions = Array.isArray(question.options) ? question.options : [];
      newOptions = [...existingOptions, newOption];
    }
    
    updateQuestion(questionId, 'options', newOptions);
    setNewOption("");
  };

  const removeOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    
    const newOptions = [...question.options];
    newOptions.splice(index, 1);
    updateQuestion(questionId, 'options', newOptions);
  };

  const getTypeIcon = (type: string | null) => {
    const typeConfig = QUESTION_TYPES.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Type className="w-4 h-4" />;
  };

  const getTypeBadgeColor = (type: string | null) => {
    switch (type) {
      case 'buttons': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'multi_select': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'photos': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-white/5">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          Редактор вопросов анкеты
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuestions}
              className="border-slate-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button
              onClick={saveQuestions}
              disabled={isSaving}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить и синхронизировать
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Настройте вопросы анкеты, их порядок, тип и варианты ответов. Изменения автоматически синхронизируются с Telegram ботом.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all ${
                  q.is_active 
                    ? 'bg-slate-800/30 border-white/5 hover:border-pink-500/30' 
                    : 'bg-slate-900/50 border-white/5 opacity-50'
                }`}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Order number */}
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-sm shrink-0">
                    {q.question_order}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Question text */}
                    {editingId === q.id ? (
                      <div className="flex gap-2">
                        <Input
                          defaultValue={q.question}
                          className="bg-slate-800/50 border-pink-500/30"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateQuestion(q.id, 'question', (e.target as HTMLInputElement).value);
                              setEditingId(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = (e.currentTarget.parentElement?.firstChild as HTMLInputElement);
                            updateQuestion(q.id, 'question', input.value);
                            setEditingId(null);
                          }}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div 
                          className="cursor-pointer hover:text-pink-400 transition-colors"
                          onClick={() => setEditingId(q.id)}
                        >
                          <p className="text-sm text-white">{q.question}</p>
                          <p className="text-xs text-slate-500 mt-1">step: {q.step}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(q.id)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Type and Active toggle */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Select
                        value={q.question_type || 'text'}
                        onValueChange={(value) => updateQuestion(q.id, 'question_type', value)}
                      >
                        <SelectTrigger className="w-[200px] h-8 bg-slate-800/50 border-white/10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTypeBadgeColor(q.question_type)}`}
                      >
                        {getTypeIcon(q.question_type)}
                        <span className="ml-1">{QUESTION_TYPES.find(t => t.value === q.question_type)?.label || 'Текст'}</span>
                      </Badge>

                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500">Активен:</span>
                        <Switch
                          checked={q.is_active}
                          onCheckedChange={(checked) => updateQuestion(q.id, 'is_active', checked)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Options (for buttons and multi_select) */}
                    {(q.question_type === 'buttons' || q.question_type === 'multi_select') && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">Варианты ответов:</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOptionsId(editingOptionsId === q.id ? null : q.id)}
                            className="text-xs h-7"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {editingOptionsId === q.id ? 'Скрыть' : 'Редактировать'}
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {getOptions(q).map((option, optIdx) => (
                            <Badge 
                              key={optIdx} 
                              variant="outline" 
                              className={`text-xs ${
                                q.question_type === 'multi_select' 
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' 
                                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                              } ${editingOptionsId === q.id ? 'pr-1' : ''}`}
                            >
                              {option}
                              {editingOptionsId === q.id && (
                                <button 
                                  onClick={() => removeOption(q.id, optIdx)}
                                  className="ml-1 hover:text-red-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>

                        {editingOptionsId === q.id && (
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Добавить вариант..."
                              value={newOption}
                              onChange={(e) => setNewOption(e.target.value)}
                              className="h-8 bg-slate-800/50 border-white/10 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addOption(q.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => addOption(q.id)}
                              className="h-8"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
