import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Problem, ProblemDraft } from '@shared/types/problem';

export function useProblems() {
  return useQuery<Problem[]>({
    queryKey: ['problems'],
    queryFn: () => window.lv.problems.list(),
  });
}

export function useProblem(id: number | null) {
  return useQuery<Problem | null>({
    queryKey: ['problems', id],
    queryFn: () => (id == null ? Promise.resolve(null) : window.lv.problems.get(id)),
    enabled: id != null,
  });
}

export function useCreateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draft: ProblemDraft) => window.lv.problems.create(draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problems'] }),
  });
}

export function useUpdateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: ProblemDraft }) =>
      window.lv.problems.update(id, draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problems'] }),
  });
}

export function useDeleteProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.lv.problems.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problems'] }),
  });
}
