import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const isSpanish = i18n.language === 'es';
  const flag = isSpanish ? '🇪🇸' : '🇬🇧';
  const label = isSpanish ? 'ES' : 'EN';
  const title = isSpanish ? 'Switch to English' : 'Cambiar a Español';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-muted-foreground hover:text-foreground"
      title={title}
    >
      <span className="text-lg">{flag}</span>
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}
