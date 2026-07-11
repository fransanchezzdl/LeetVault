import {
  CalendarClock,
  Heart,
  HelpCircle,
  ListChecks,
  Map as MapIcon,
  MessagesSquare,
  PieChart,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { SlidingIndicator, useSlidingIndicator } from '../ui/SlidingIndicator';
import { useUi, type View } from '../../store/ui';
import logoUrl from '../../assets/logo.png';

interface NavItem {
  id: View;
  labelKey: string;
  icon: React.ReactNode;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'problems', labelKey: 'nav.problems', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'review', labelKey: 'nav.review', icon: <CalendarClock className="h-4 w-4" /> },
  { id: 'stats', labelKey: 'nav.stats', icon: <PieChart className="h-4 w-4" /> },
  { id: 'roadmap', labelKey: 'nav.roadmap', icon: <MapIcon className="h-4 w-4" /> },
  { id: 'interview', labelKey: 'nav.interview', icon: <MessagesSquare className="h-4 w-4" /> },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'settings', labelKey: 'nav.settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'help', labelKey: 'nav.help', icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'donate', labelKey: 'nav.donate', icon: <Heart className="h-4 w-4" /> },
];

export function Sidebar() {
  const { t } = useTranslation('common');
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);

  const { containerRef, setItemRef, rect } = useSlidingIndicator<View, HTMLElement>(view);

  const renderItem = (n: NavItem) => (
    <button
      key={n.id}
      type="button"
      ref={setItemRef(n.id)}
      onClick={() => setView(n.id)}
      className={cn(
        'nav-btn w-full text-left transition-colors duration-300',
        view === n.id && 'text-fg hover:bg-transparent',
      )}
    >
      {n.icon}
      <span className="text-sm">{t(n.labelKey)}</span>
    </button>
  );

  return (
    <aside
      ref={containerRef}
      className="relative flex w-56 flex-shrink-0 flex-col gap-2 overflow-hidden rounded-2xl bg-[var(--sidebar-bg)] p-4 shadow-[var(--shadow-panel)] ring-1 ring-inset ring-fg/10 backdrop-blur-[28px] backdrop-saturate-[180%]"
    >
      <div className="pointer-events-none absolute inset-0 bg-sidebar-grad opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fg/25 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -top-20 -left-10 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-44 w-44 rounded-full bg-brand-700/15 blur-3xl" aria-hidden />

      <SlidingIndicator rect={rect} />

      <div className="relative mb-3 flex items-center gap-2 px-2">
        <img src={logoUrl} alt="LeetVault" className="h-7 w-7 rounded-md" />
        <span className="text-base font-semibold tracking-tight">LeetVault</span>
      </div>

      <nav className="relative flex flex-col gap-1">
        {PRIMARY_NAV.map(renderItem)}
      </nav>

      <div className="relative mt-auto flex flex-col gap-1">
        <div className="mx-2 my-2 h-px bg-fg/10" aria-hidden />
        <nav className="flex flex-col gap-1">
          {SECONDARY_NAV.map(renderItem)}
        </nav>
        <div className="mt-2 px-2 text-[10px] text-fgMuted/70">
          LeetVault v{__APP_VERSION__}
        </div>
      </div>
    </aside>
  );
}
