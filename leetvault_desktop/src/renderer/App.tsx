import { useEffect } from 'react';
import { TitleBar } from './components/chrome/TitleBar';
import { Sidebar } from './components/chrome/Sidebar';
import { useUi } from './store/ui';
import { ProblemsView } from './features/problems/ProblemsView';
import { ReviewView } from './features/review/ReviewView';
import { StatsView } from './features/stats/StatsView';
import { RoadmapView } from './features/roadmap/RoadmapView';
import { InterviewView } from './features/interview/InterviewView';
import { HelpView } from './features/help/HelpView';
import { SettingsView } from './features/settings/SettingsView';
import { DonateView } from './features/donate/DonateView';
import { AnalyticsNotice } from './components/AnalyticsNotice';
import { UpdateModal } from './components/UpdateModal';
import { bindCacheInvalidation } from './lib/queryClient';
import { useApplyTheme } from './hooks/useApplyTheme';

const isMac = navigator.userAgent.toLowerCase().includes('mac');

export function App() {
  const view = useUi((s) => s.view);

  useApplyTheme();
  useEffect(() => bindCacheInvalidation(), []);

  return (
    <div
      className={
        'flex h-full flex-col overflow-hidden bg-app-grad' +
        (isMac ? '' : ' rounded-2xl border border-glass-stroke/10 shadow-[var(--shadow-outer)]')
      }
    >
      <TitleBar />
      <div className="flex min-h-0 flex-1 gap-3 p-3 pt-0">
        <Sidebar />
        <main className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[var(--panel-bg)] shadow-[var(--shadow-panel)] ring-1 ring-inset ring-fg/10 backdrop-blur-2xl backdrop-saturate-150">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fg/25 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fg/[0.04] via-transparent to-fg/[0.015]" aria-hidden />
          <div className="relative h-full">
            {view === 'problems' ? <ProblemsView /> : null}
            {view === 'review' ? <ReviewView /> : null}
            {view === 'stats' ? <StatsView /> : null}
            {view === 'roadmap' ? <RoadmapView /> : null}
            {view === 'interview' ? <InterviewView /> : null}
            {view === 'help' ? <HelpView /> : null}
            {view === 'settings' ? <SettingsView /> : null}
            {view === 'donate' ? <DonateView /> : null}
          </div>
        </main>
      </div>
      <AnalyticsNotice />
      <UpdateModal />
    </div>
  );
}
