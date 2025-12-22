import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Mail, Lock, ArrowRight, Loader2, UserPlus } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSetupMode) {
        const { error } = await signUp(email, password, email.split('@')[0]);
        if (error) {
          toast.error(error.message || "Ошибка создания аккаунта");
        } else {
          toast.success("Аккаунт создан! Теперь войдите.");
          setIsSetupMode(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error("Неверный логин или пароль");
        } else {
          toast.success("Добро пожаловать!");
          navigate("/dashboard");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#0088cc]/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#00a8e8] flex items-center justify-center shadow-lg shadow-[#0088cc]/30">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Telegram Bot Manager
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {isSetupMode ? "Создание аккаунта администратора" : "Войдите в панель управления"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSetupMode ? (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Создать аккаунт
                    </>
                  ) : (
                    <>
                      Войти
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSetupMode(!isSetupMode)}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {isSetupMode ? "← Назад к входу" : "Первоначальная настройка"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
