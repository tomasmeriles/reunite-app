import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  return (
    <Button
      variant="ghost"
      size="sm"
      className="font-mono text-xs uppercase"
      onClick={() => i18n.changeLanguage(isEn ? 'es' : 'en')}
    >
      {isEn ? 'ES' : 'EN'}
    </Button>
  );
}
