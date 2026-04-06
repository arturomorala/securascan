import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function FooterLanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const isSpanish = i18n.language === 'es';
  const flag = isSpanish ? '🇪🇸' : '🇬🇧';
  const label = isSpanish ? 'Español' : 'English';
  const title = isSpanish ? 'Switch to English' : 'Cambiar a Español';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
      title={title}
    >
      <span className="text-base">{flag}</span>
      <span className="font-medium">{label}</span>
    </Button>
  );
}
