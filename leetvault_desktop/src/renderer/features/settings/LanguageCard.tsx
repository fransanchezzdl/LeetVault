import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '@shared/lang';
import { useUi } from '../../store/ui';

const LANGS: { value: Lang; labelKey: string }[] = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'es', labelKey: 'language.es' },
];

export function LanguageCard() {
  const { t } = useTranslation('settings');
  const language = useUi((s) => s.language);
  const setLanguage = useUi((s) => s.setLanguage);

  return (
    <section className="rounded-2xl border border-glass-stroke bg-white/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Languages className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">{t('language.title')}</h2>
      </div>

      <p className="mb-4 text-sm text-fgMuted">{t('language.description')}</p>

      <div className="inline-flex rounded-lg border border-glass-stroke bg-black/20 p-1">
        {LANGS.map(({ value, labelKey }) => {
          const active = value === language;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (!active) void setLanguage(value);
              }}
              className={
                'rounded-md px-4 py-1.5 text-sm font-medium transition ' +
                (active
                  ? 'bg-brand-500 text-black'
                  : 'text-fgMuted hover:text-fg')
              }
              aria-pressed={active}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
