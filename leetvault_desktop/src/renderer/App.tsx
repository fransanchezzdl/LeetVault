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
import { bindCacheInvalidation } from './lib/queryClient';

export function App() {
  const view = useUi((s) => s.view);

  useEffect(() => bindCacheInvalidation(), []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-glass-stroke bg-app-grad shadow-2xl">
      <TitleBar />
      <div className="flex min-h-0 flex-1 gap-3 p-3 pt-0">
        <Sidebar />
        <main className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white/[0.03] shadow-[0_8px_40px_rgba(0,0,0,0.25)] ring-1 ring-inset ring-white/10 backdrop-blur-2xl backdrop-saturate-150">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.015]" aria-hidden />
          <div className="relative h-full">
            {view === 'problems' ? <ProblemsView /> : null}
            {view === 'review' ? <ReviewView /> : null}
            {view === 'stats' ? <StatsView /> : null}
            {view === 'roadmap' ? <RoadmapView /> : null}
            {view === 'interview' ? <InterviewView /> : null}
            {view === 'help' ? <HelpView /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
