import { Settings as SettingsIcon } from 'lucide-react';
import { AnalyticsCard } from './AnalyticsCard';

export function SettingsView() {
  return (
    <div className="h-full overflow-auto scroll-thin">
      <div className="px-8 py-7">
        <header className="mb-6 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-brand-400" />
          <h1 className="text-2xl font-bold text-fg">Ajustes</h1>
        </header>

        <div className="max-w-3xl space-y-5">
          <AnalyticsCard />
        </div>
      </div>
    </div>
  );
}
