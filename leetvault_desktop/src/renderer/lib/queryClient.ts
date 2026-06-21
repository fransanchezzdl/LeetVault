import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Wires renderer cache invalidation to main-process broadcast events. Replaces
 * the v1 `setInterval(2500)` poll: when the extension saves via Fastify or a UI
 * write completes via IPC, the main process emits and we invalidate.
 *
 * Returns an unsubscribe fn for HMR cleanup.
 */
export function bindCacheInvalidation(): () => void {
  const offProblems = window.lv.on('events:problems-changed', () => {
    queryClient.invalidateQueries({ queryKey: ['problems'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  });
  const offReviews = window.lv.on('events:reviews-changed', () => {
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  });
  return () => {
    offProblems();
    offReviews();
  };
}
