import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface RegistrationBannerProps {
  className?: string;
}

const RegistrationBanner = ({ className = '' }: RegistrationBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div className={`relative glass rounded-2xl p-4 border border-primary/30 ${className}`}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        
        <div>
          <h3 className="font-semibold text-sm mb-1">{t.auth?.register || 'Регистрация'}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t.auth?.registerDescription || 'Создайте аккаунт для записи созвонов'}
          </p>
          
          <Button
            size="sm"
            onClick={() => navigate('/auth?mode=register')}
            className="h-8 text-xs"
          >
            <FileText className="w-3 h-3 mr-1" />
            {t.auth?.registerButton || 'Зарегистрироваться'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationBanner;