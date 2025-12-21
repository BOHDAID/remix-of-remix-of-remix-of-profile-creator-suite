import { useAppStore } from '@/stores/appStore';
import { translations, TranslationKey, getDirection, getFontFamily, Language } from '@/lib/i18n';

export function useTranslation() {
  const { settings } = useAppStore();
  const lang = settings.language as Language;

  const t = (key: TranslationKey): string => {
    return translations[lang]?.[key] || translations.ar[key] || key;
  };

  const dir = getDirection(lang);
  const fontFamily = getFontFamily(lang);

  return {
    t,
    lang,
    dir,
    fontFamily,
    isRTL: dir === 'rtl',
  };
}
