import { useQuery } from '@tanstack/react-query';
import type { StatsBundle } from '@shared/types/stats';
import type { InterviewStatsBundle } from '@shared/types/interview';

export function useStatsBundle() {
  return useQuery<StatsBundle>({
    queryKey: ['stats', 'bundle'],
    queryFn: () => window.lv.stats.bundle(),
  });
}

export function useInterviewStats() {
  return useQuery<InterviewStatsBundle>({
    queryKey: ['stats', 'interview'],
    queryFn: () => window.lv.interview.stats(),
  });
}
