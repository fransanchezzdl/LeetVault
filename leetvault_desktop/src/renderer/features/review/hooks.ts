import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Problem } from '@shared/types/problem';
import type { Quality } from '@shared/types/review';

export function useDueReviews() {
  return useQuery<Problem[]>({
    queryKey: ['reviews', 'due'],
    queryFn: () => window.lv.reviews.due(),
  });
}

export function useNextReviewDate() {
  return useQuery<string | null>({
    queryKey: ['reviews', 'next'],
    queryFn: () => window.lv.reviews.nextDate(),
  });
}

export function useRateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quality }: { id: number; quality: Quality }) =>
      window.lv.reviews.rate(id, quality),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useFinishReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.lv.reviews.finish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });
}
