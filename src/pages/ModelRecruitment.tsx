import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Send, 
  User, 
  Globe, 
  Smartphone,
  Camera,
  Heart,
  Instagram,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import CustomCursor from "@/components/CustomCursor";
import cfLogo from "@/assets/cf-logo-new.png";

const SOCIAL_PLATFORMS = [
  { id: "twitter", label: "Twitter" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "telegram", label: "Telegram канал" },
  { id: "youtube", label: "YouTube канал" },
  { id: "facebook", label: "Facebook" },
  { id: "twitch", label: "Twitch" },
  { id: "other", label: "Другое" },
];

const TIME_OPTIONS = [
  { id: "1-3", label: "От 1-3 часов почти каждый день" },
  { id: "3-6", label: "От 3-6 часов большую часть недели" },
  { id: "6-10", label: "От 6-10 часов несколько дней в неделю" },
];

const CONTENT_OPTIONS = [
  { id: "toys_video", label: "Видео с игрушками (дилдо/вибратор и т.д)" },
  { id: "closeup_pussy", label: 'Крупный план "Pussy"' },
  { id: "closeup_butt", label: "Крупный план попы" },
  { id: "closeup_breasts", label: "Крупный план груди" },
  { id: "closeup_feet", label: "Крупный план стоп/ноги" },
  { id: "masturbation_fingers", label: "Мастурбация пальцами" },
  { id: "masturbation_vibrator", label: "Мастурбация (Вибратор)" },
  { id: "masturbation_dildo", label: "Мастурбация Дилдо (дилдо вовнутрь)" },
  { id: "lingerie", label: "Эротическое нижнее белье" },
  { id: "stockings", label: "Колготки/чулки" },
  { id: "bj_toy", label: "Минет с игрушкой" },
  { id: "couple", label: "Парный контент (есть подруга/друг)" },
  { id: "videocalls", label: "Согласны ли вы на кастомы/видеозвонки с европейцами?" },
  { id: "american_socials", label: "Согласны на создание американских соц.сетей?" },
  { id: "anal", label: "Проникновение в анал" },
  { id: "double", label: "Двойное проникновение" },
  { id: "squirt", label: "Сквирт" },
];

const PLATFORMS = [
  { id: "onlyfans", label: "OnlyFans" },
  { id: "fansly", label: "Fansly" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitter", label: "Twitter/X" },
];

const formSchema = z.object({
  telegram_username: z.string().min(2, "Укажите ваш Telegram"),
  full_name: z.string().min(2, "Укажите ваше имя"),
  age: z.number().min(18, "Минимальный возраст 18 лет").max(100),
  hair_color: z.string().min(1, "Укажите цвет волос"),
  body_params: z.string().min(1, "Укажите параметры"),
  height: z.string().min(1, "Укажите рост"),
  weight: z.string().min(1, "Укажите вес"),
  language_skills: z.string().min(1, "Укажите уровень владения языками"),
  citizenship: z.string().optional(),
  desired_income: z.string().min(1, "Укажите желаемый доход"),
  platforms: z.array(z.string()).min(1, "Выберите хотя бы одну платформу"),
  about_yourself: z.string().min(10, "Расскажите немного о себе"),
  social_media_experience: z.array(z.string()),
  social_media_links: z.string().optional(),
  equipment: z.string().min(1, "Укажите ваше оборудование"),
  time_availability: z.string().min(1, "Выберите количество времени"),
  content_preferences: z.array(z.string()).min(1, "Выберите хотя бы один пункт"),
});

type FormData = z.infer<typeof formSchema>;

const ModelRecruitment = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platforms: [],
      social_media_experience: [],
      content_preferences: [],
    },
  });

  const watchedPlatforms = watch("platforms");
  const watchedSocialMedia = watch("social_media_experience");
  const watchedContentPrefs = watch("content_preferences");
  const watchedTimeAvailability = watch("time_availability");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + uploadedPhotos.length > 10) {
        toast({
          title: "Слишком много файлов",
          description: "Максимум 10 фотографий",
          variant: "destructive",
        });
        return;
      }
      setUploadedPhotos((prev) => [...prev, ...files]);
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    const applicationId = crypto.randomUUID();

    for (const file of uploadedPhotos) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${applicationId}/${crypto.randomUUID()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("model-applications")
        .upload(filePath, file);

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      urls.push(filePath);
    }

    return urls;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      let photoUrls: string[] = [];
      
      if (uploadedPhotos.length > 0) {
        photoUrls = await uploadPhotos();
      }

      const { error } = await supabase.from("model_applications").insert({
        telegram_username: data.telegram_username,
        full_name: data.full_name,
        age: data.age,
        hair_color: data.hair_color,
        body_params: data.body_params,
        height: data.height,
        weight: data.weight,
        language_skills: data.language_skills,
        citizenship: data.citizenship || null,
        desired_income: data.desired_income,
        platforms: data.platforms,
        about_yourself: data.about_yourself,
        social_media_experience: data.social_media_experience,
        social_media_links: data.social_media_links || null,
        equipment: data.equipment,
        time_availability: data.time_availability,
        content_preferences: data.content_preferences,
        portfolio_photos: photoUrls,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в Telegram в ближайшее время",
      });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заявку. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArrayValue = (
    field: "platforms" | "social_media_experience" | "content_preferences",
    value: string
  ) => {
    const current = watch(field) || [];
    if (current.includes(value)) {
      setValue(
        field,
        current.filter((v) => v !== value)
      );
    } else {
      setValue(field, [...current, value]);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <CustomCursor />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Заявка успешно отправлена!
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Спасибо за интерес к сотрудничеству с нами. Мы рассмотрим вашу заявку 
            и свяжемся с вами в Telegram в течение 24-48 часов.
          </p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Вернуться на главную
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomCursor />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={cfLogo} alt="Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground">
              Model Recruitment
            </span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Присоединяйся к команде</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Стань частью{" "}
            <span className="text-primary">Apollo Production</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Заполни анкету ниже, и мы свяжемся с тобой для обсуждения 
            сотрудничества. Все данные конфиденциальны.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Contact Info */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MessageCircle className="w-5 h-5 text-primary" />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telegram">Твой Telegram *</Label>
                <Input
                  id="telegram"
                  placeholder="@username"
                  {...register("telegram_username")}
                  className="bg-background/50"
                />
                {errors.telegram_username && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.telegram_username.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="fullName">Твоё полное имя *</Label>
                <Input
                  id="fullName"
                  placeholder="Имя Фамилия"
                  {...register("full_name")}
                  className="bg-background/50"
                />
                {errors.full_name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-primary" />
                Личная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Настоящий возраст *</Label>
                  <Input
                    id="age"
                    type="number"
                    min={18}
                    placeholder="21"
                    {...register("age", { valueAsNumber: true })}
                    className="bg-background/50"
                  />
                  {errors.age && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.age.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hair">Цвет твоих прекрасных локонов *</Label>
                  <Input
                    id="hair"
                    placeholder="Блондинка"
                    {...register("hair_color")}
                    className="bg-background/50"
                  />
                  {errors.hair_color && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.hair_color.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="bodyParams">
                  Примерные параметры твоего тела по принципу "Marilyn Monroe" *
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Пример: 91/56/91 см
                </p>
                <Input
                  id="bodyParams"
                  placeholder="90/60/90"
                  {...register("body_params")}
                  className="bg-background/50"
                />
                {errors.body_params && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.body_params.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Твой рост *</Label>
                  <Input
                    id="height"
                    placeholder="170 см"
                    {...register("height")}
                    className="bg-background/50"
                  />
                  {errors.height && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.height.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="weight">Примерный вес *</Label>
                  <Input
                    id="weight"
                    placeholder="55 кг"
                    {...register("weight")}
                    className="bg-background/50"
                  />
                  {errors.weight && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.weight.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages & Goals */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Globe className="w-5 h-5 text-primary" />
                Языки и цели
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="languages">
                  Владение английским или любым другим языком по шкале от 1-10 *
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Просьба указать списком по пунктам. P.S. Ничего страшного, если 
                  не даются языки, это не обязательный фактор ❤️
                </p>
                <Textarea
                  id="languages"
                  placeholder="Английский - 7&#10;Испанский - 5"
                  {...register("language_skills")}
                  className="bg-background/50"
                />
                {errors.language_skills && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.language_skills.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="citizenship">Твоё гражданство</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  P.S. Если их два-три, укажите списком
                </p>
                <Input
                  id="citizenship"
                  placeholder="Россия"
                  {...register("citizenship")}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label htmlFor="income">Желаемый доход на платформе "OnlyFans"? *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  P.S. Многие пишут от $500 - $1.500 со второго месяца, т.к. первый 
                  месяц всегда тестовый, но даже при этом, более 75% моделей 
                  зарабатывают на первых порах от $1.000 - $5.000 и более
                </p>
                <Input
                  id="income"
                  placeholder="$3000+"
                  {...register("desired_income")}
                  className="bg-background/50"
                />
                {errors.desired_income && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.desired_income.message}
                  </p>
                )}
              </div>
              <div>
                <Label>На каких платформах ты хочешь развиваться? *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {PLATFORMS.map((platform) => (
                    <div
                      key={platform.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        watchedPlatforms?.includes(platform.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleArrayValue("platforms", platform.id)}
                    >
                      <Checkbox
                        checked={watchedPlatforms?.includes(platform.id)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm">{platform.label}</span>
                    </div>
                  ))}
                </div>
                {errors.platforms && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.platforms.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Heart className="w-5 h-5 text-primary" />
                О тебе
              </CardTitle>
              <CardDescription>
                Расскажи буквально пару слов о себе и твоих сильных сторнах. Словно 
                это не анкета, а ты просто делишься со своей подругой о том, как 
                проходят твои дела (можешь поделится своими хобби и увлечениями). 
                Ведь в первую очередь я очень ценю тебя как личность, а не просто 
                какую то будущую модель 🤍
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Расскажи о себе..."
                {...register("about_yourself")}
                className="bg-background/50 min-h-[150px]"
              />
              {errors.about_yourself && (
                <p className="text-destructive text-sm mt-1">
                  {errors.about_yourself.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Instagram className="w-5 h-5 text-primary" />
                Социальные сети
              </CardTitle>
              <CardDescription>
                Вела ли когда нибудь соц.сети и с чем тебе привычней и комфотно 
                работать? Поставь галочки, где у тебя уже есть соц.сети, в которых 
                можно публиковать твой контент
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      watchedSocialMedia?.includes(platform.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() =>
                      toggleArrayValue("social_media_experience", platform.id)
                    }
                  >
                    <Checkbox
                      checked={watchedSocialMedia?.includes(platform.id)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm">{platform.label}</span>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="socialLinks">
                  Оставь свои соц. сети + укажи кол-во подписчиков *
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  По примеру "Insta [ 42k+ ]". P.S. если их несколько, то пропиши в столбик.
                </p>
                <Textarea
                  id="socialLinks"
                  placeholder="Instagram [ 15k+ ]&#10;TikTok [ 50k+ ]"
                  {...register("social_media_links")}
                  className="bg-background/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipment & Time */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Smartphone className="w-5 h-5 text-primary" />
                Оборудование и время
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="equipment">
                  Модель твоего телефона/оборудования для съемки и ведения контента *
                </Label>
                <Textarea
                  id="equipment"
                  placeholder="iPhone 14 Pro Max, кольцевая лампа..."
                  {...register("equipment")}
                  className="bg-background/50"
                />
                {errors.equipment && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.equipment.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Кол-во времени в день, которое готовы уделять *</Label>
                <div className="space-y-2 mt-2">
                  {TIME_OPTIONS.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        watchedTimeAvailability === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setValue("time_availability", option.id)}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          watchedTimeAvailability === option.id
                            ? "border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {watchedTimeAvailability === option.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="text-sm">{option.label}</span>
                    </div>
                  ))}
                </div>
                {errors.time_availability && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.time_availability.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Camera className="w-5 h-5 text-primary" />
                Фотографии
              </CardTitle>
              <CardDescription>
                Буквально 5-7 фотографий в стиле "Ню" или же просто в облегающей 
                одежде, будто вы хотели сделать так, чтобы ваш Олень - бывший 
                случайно увидел историю в инсте и понял какую кошечку он потерял 🤍
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Camera className="w-10 h-10 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Нажми для загрузки фотографий
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Максимум 10 файлов
                  </span>
                </label>
              </div>
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                  {uploadedPhotos.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Preferences */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Опросник по содержанию контента
              </CardTitle>
              <CardDescription>
                Последний и самый важный опросник! Нужно будет поставить галочки 
                напротив того, на что вы готовы и НЕ ставить там, что для вас "ТАБУ"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTENT_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      watchedContentPrefs?.includes(option.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() =>
                      toggleArrayValue("content_preferences", option.id)
                    }
                  >
                    <Checkbox
                      checked={watchedContentPrefs?.includes(option.id)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>
              {errors.content_preferences && (
                <p className="text-destructive text-sm mt-1">
                  {errors.content_preferences.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 py-6 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Отправить заявку
                </>
              )}
            </Button>
          </motion.div>

          <p className="text-center text-sm text-muted-foreground">
            Нажимая "Отправить заявку", вы соглашаетесь с обработкой ваших данных
          </p>
        </form>
      </main>
    </div>
  );
};

export default ModelRecruitment;
