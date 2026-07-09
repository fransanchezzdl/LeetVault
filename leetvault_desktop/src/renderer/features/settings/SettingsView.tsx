import { useState } from 'react';
import { Languages, Palette, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { SlidingIndicator, useSlidingIndicator } from '../../components/ui/SlidingIndicator';
import { AnalyticsCard } from './AnalyticsCard';
import { AppearanceCard } from './AppearanceCard';
import { DataCard } from './DataCard';
import { LanguageCard } from './LanguageCard';

type Section = 'language' | 'appearance' | 'privacyData';

const SECTIONS: { id: Section; icon: LucideIcon }[] = [
  { id: 'language', icon: Languages },
  { id: 'appearance', icon: Palette },
  { id: 'privacyData', icon: ShieldCheck },
];

export function SettingsView() {
  const { t } = useTranslation('settings');
  const [section, setSection] = useState<Section>('language');
  const { containerRef, setItemRef, rect } = useSlidingIndicator<Section, HTMLElement>(section);

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-glass-stroke/10 bg-bg-200/40 px-3 py-5 backdrop-blur-sm">
        <header className="mb-4 flex items-center gap-2 px-2">
          <SettingsIcon className="h-4 w-4 text-brand-400" />
          <h1 className="text-sm font-semibold tracking-tight text-fg">{t('title')}</h1>
        </header>
        <nav ref={containerRef} className="relative flex flex-col gap-1 overflow-auto scroll-thin">
          <SlidingIndicator rect={rect} />
          {SECTIONS.map((s) => {
            const active = s.id === section;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                ref={setItemRef(s.id)}
                onClick={() => setSection(s.id)}
                className={cn(
                  'nav-btn relative w-full text-left transition-colors duration-300',
                  active && 'text-fg hover:bg-transparent'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{t(`nav.${s.id}`)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-auto scroll-thin">
        <div className="max-w-3xl px-8 py-7">
          {section === 'language' ? <LanguageCard /> : null}
          {section === 'appearance' ? <AppearanceCard /> : null}
          {section === 'privacyData' ? (
            <div className="flex flex-col gap-5">
              <AnalyticsCard />
              <DataCard />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
