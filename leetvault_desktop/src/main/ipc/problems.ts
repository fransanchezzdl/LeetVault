import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import { ProblemsRepo } from '../db/problems.repo';
import { broadcast } from '../events/bus';
import { capture } from '../analytics/posthog';
import type { ProblemDraft } from '@shared/types/problem';

export function registerProblemsIpc(): void {
  ipcMain.handle(IpcChannels.Problems.List, () => ProblemsRepo.list());

  ipcMain.handle(IpcChannels.Problems.Get, (_e, { id }: { id: number }) =>
    ProblemsRepo.get(id)
  );

  ipcMain.handle(
    IpcChannels.Problems.GetByNumber,
    (_e, { number }: { number: number }) => ProblemsRepo.getByNumber(number)
  );

  ipcMain.handle(IpcChannels.Problems.Create, (_e, draft: ProblemDraft) => {
    const res = ProblemsRepo.create(draft);
    broadcast(IpcChannels.Events.ProblemsChanged, {
      source: 'ui',
      action: 'created',
      id: res.id,
    });
    capture('problem_created', {
      difficulty: draft.difficulty,
      status: (draft.status ?? 'Solved') as 'Solved' | 'In Progress' | 'To Review',
      has_pattern: Boolean(draft.pattern && draft.pattern.trim()),
    });
    return res;
  });

  ipcMain.handle(
    IpcChannels.Problems.Update,
    (_e, payload: ProblemDraft & { id: number }) => {
      const { id, ...draft } = payload;
      ProblemsRepo.update(id, draft);
      broadcast(IpcChannels.Events.ProblemsChanged, {
        source: 'ui',
        action: 'updated',
        id,
      });
      capture('problem_updated', {
        difficulty: draft.difficulty,
        status: (draft.status ?? 'Solved') as 'Solved' | 'In Progress' | 'To Review',
      });
    }
  );

  ipcMain.handle(IpcChannels.Problems.Delete, (_e, { id }: { id: number }) => {
    ProblemsRepo.remove(id);
    broadcast(IpcChannels.Events.ProblemsChanged, {
      source: 'ui',
      action: 'deleted',
      id,
    });
    capture('problem_deleted', {});
  });

  ipcMain.handle(
    IpcChannels.Problems.ByPattern,
    (_e, { pattern }: { pattern: string }) => ProblemsRepo.byPattern(pattern)
  );
}
