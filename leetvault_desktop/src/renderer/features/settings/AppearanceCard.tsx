import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useUi, type Theme } from '../../store/ui';

export function AppearanceCard() {
  const { t } = useTranslation('settings');
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);

  const options: { value: Theme; label: string }[] = [
    { value: 'system', label: t('appearance.system') },
    { value: 'dark', label: t('appearance.dark') },
    { value: 'light', label: t('appearance.light') },
  ];

  return (
    <section className="rounded-2xl border border-glass-stroke/10 bg-fg/[0.04] p-5">
      <div className="mb-3 flex items-center gap-2">
        <Palette className="h-4 w-4 text-brand-400" />
        <h2 className="text-base font-bold text-brand-200">{t('appearance.title')}</h2>
      </div>

      <div className="flex items-center justify-between gap-6">
        <p className="min-w-0 flex-1 text-sm text-fg/[0.68]">{t('appearance.description')}</p>
        <SegmentedControl
          value={theme}
          onChange={setTheme}
          options={options}
          ariaLabel={t('appearance.title')}
        />
      </div>
    </section>
  );
}
