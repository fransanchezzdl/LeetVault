import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '@shared/lang';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useUi } from '../../store/ui';

export function LanguageCard() {
  const { t } = useTranslation('settings');
  const language = useUi((s) => s.language);
  const setLanguage = useUi((s) => s.setLanguage);

  const options: { value: Lang; label: string }[] = [
    { value: 'en', label: t('language.en') },
    { value: 'es', label: t('language.es') },
  ];

  return (
    <section className="rounded-2xl border border-glass-stroke/10 bg-fg/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Languages className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">{t('language.title')}</h2>
      </div>

      <div className="flex items-center justify-between gap-6">
        <p className="min-w-0 flex-1 text-sm text-fg/[0.68]">{t('language.description')}</p>
        <SegmentedControl
          value={language}
          onChange={(v) => void setLanguage(v)}
          options={options}
          ariaLabel={t('language.title')}
        />
      </div>
    </section>
  );
}
