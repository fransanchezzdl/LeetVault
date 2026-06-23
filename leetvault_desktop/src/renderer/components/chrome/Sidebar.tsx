import {
  CalendarClock,
  HelpCircle,
  ListChecks,
  Map,
  MessagesSquare,
  PieChart,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useUi, type View } from '../../store/ui';
import logoUrl from '../../assets/logo.png';

interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  { id: 'problems', label: 'Problemas', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'review', label: 'Repaso', icon: <CalendarClock className="h-4 w-4" /> },
  { id: 'stats', label: 'Estadísticas', icon: <PieChart className="h-4 w-4" /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Map className="h-4 w-4" /> },
  { id: 'interview', label: 'Entrevista', icon: <MessagesSquare className="h-4 w-4" /> },
  { id: 'help', label: 'Ayuda', icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'settings', label: 'Ajustes', icon: <Settings className="h-4 w-4" /> },
];

export function Sidebar() {
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);

  return (
    <aside className="relative flex w-56 flex-shrink-0 flex-col gap-2 overflow-hidden rounded-2xl bg-white/[0.03] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.30)] ring-1 ring-inset ring-white/10 backdrop-blur-[28px] backdrop-saturate-[180%]">
      <div className="pointer-events-none absolute inset-0 bg-sidebar-grad opacity-70" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -top-20 -left-10 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-44 w-44 rounded-full bg-brand-700/15 blur-3xl" aria-hidden />

      <div className="relative mb-3 flex items-center gap-2 px-2">
        <img src={logoUrl} alt="LeetVault" className="h-7 w-7 rounded-md" />
        <span className="text-base font-semibold tracking-tight">LeetVault</span>
      </div>

      <nav className="relative flex flex-col gap-1">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setView(n.id)}
            className={cn(view === n.id ? 'nav-btn-active' : 'nav-btn', 'w-full text-left')}
          >
            {n.icon}
            <span className="text-sm">{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="relative mt-auto px-2 text-[10px] text-fgMuted/70">
        LeetVault v{__APP_VERSION__}
      </div>
    </aside>
  );
}
