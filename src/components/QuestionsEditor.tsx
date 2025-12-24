import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Edit3, Save, ChevronUp, ChevronDown, Plus, Trash2, RefreshCw, 
  MessageSquare, ListChecks, Image, Type, X, Info, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  description: string | null;
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
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editingOptionsId, setEditingOptionsId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ step: '', question: '', question_type: 'text', description: '' });

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
            is_active: q.is_active,
            description: q.description
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

  const createQuestion = async () => {
    if (!newQuestion.step.trim() || !newQuestion.question.trim()) {
      toast.error("Заполните шаг и текст вопроса");
      return;
    }

    const maxOrder = questions.length > 0 
      ? Math.max(...questions.map(q => q.question_order)) 
      : 0;

    const { data, error } = await supabase
      .from("bot_questionnaire_questions")
      .insert({
        step: newQuestion.step.toLowerCase().replace(/\s+/g, '_'),
        question: newQuestion.question,
        question_type: newQuestion.question_type,
        description: newQuestion.description || null,
        question_order: maxOrder + 1,
        is_active: true,
        options: newQuestion.question_type === 'buttons' || newQuestion.question_type === 'multi_select' ? [] : null
      })
      .select()
      .single();

    if (error) {
      toast.error("Ошибка создания вопроса");
      console.error(error);
    } else {
      toast.success("Вопрос создан!");
      setQuestions([...questions, data]);
      setNewQuestion({ step: '', question: '', question_type: 'text', description: '' });
      setIsCreating(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from("bot_questionnaire_questions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления вопроса");
      console.error(error);
    } else {
      toast.success("Вопрос удалён");
      setQuestions(questions.filter(q => q.id !== id));
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
        <CardTitle className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <span>Редактор вопросов анкеты</span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Новый вопрос
            </Button>
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
              Сохранить
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Настройте вопросы анкеты, их порядок, тип и варианты ответов. Изменения автоматически синхронизируются с Telegram ботом.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Create new question form */}
        {isCreating && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Создать новый вопрос
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Шаг (step)</label>
                <Input
                  placeholder="например: webcam_experience"
                  value={newQuestion.step}
                  onChange={(e) => setNewQuestion({ ...newQuestion, step: e.target.value })}
                  className="bg-slate-800/50 border-emerald-500/30"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Тип вопроса</label>
                <Select
                  value={newQuestion.question_type}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-emerald-500/30">
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
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Текст вопроса</label>
                <Textarea
                  placeholder="Введите текст вопроса..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  className="bg-slate-800/50 border-emerald-500/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Подсказка (описание)</label>
                <Input
                  placeholder="Подсказка для пользователя..."
                  value={newQuestion.description}
                  onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                  className="bg-slate-800/50 border-emerald-500/30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Отмена
              </Button>
              <Button size="sm" onClick={createQuestion} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </div>
          </div>
        )}

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
                        <Textarea
                          defaultValue={q.question}
                          className="bg-slate-800/50 border-pink-500/30 min-h-[60px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              updateQuestion(q.id, 'question', (e.target as HTMLTextAreaElement).value);
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
                            const textarea = (e.currentTarget.parentElement?.firstChild as HTMLTextAreaElement);
                            updateQuestion(q.id, 'question', textarea.value);
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
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(q.id)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-white/10">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-white">
                                  <AlertTriangle className="w-5 h-5 text-red-500" />
                                  Удалить вопрос?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  Вопрос "{q.question.substring(0, 50)}..." будет удалён. Это действие нельзя отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 border-white/10">Отмена</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteQuestion(q.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}

                    {/* Description / Hint */}
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">Подсказка для пользователя:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 ml-auto"
                          onClick={() => setEditingDescId(editingDescId === q.id ? null : q.id)}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          {editingDescId === q.id ? 'Закрыть' : 'Редактировать'}
                        </Button>
                      </div>
                      {editingDescId === q.id ? (
                        <Textarea
                          value={q.description || ''}
                          onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                          placeholder="Введите подсказку или дополнительную информацию..."
                          className="bg-slate-800/50 border-amber-500/30 text-sm min-h-[60px]"
                        />
                      ) : (
                        <p className="text-xs text-slate-400">
                          {q.description || 'Нет подсказки. Нажмите "Редактировать" чтобы добавить.'}
                        </p>
                      )}
                    </div>

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