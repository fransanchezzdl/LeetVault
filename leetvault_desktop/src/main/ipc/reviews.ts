import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import { ReviewsRepo } from '../db/reviews.repo';
import { broadcast } from '../events/bus';
import { capture } from '../analytics/posthog';
import type { Quality } from '@shared/types/review';

export function registerReviewsIpc(): void {
  ipcMain.handle(IpcChannels.Reviews.Due, () => ReviewsRepo.due());
  ipcMain.handle(IpcChannels.Reviews.NextDate, () => ReviewsRepo.nextDate());
  ipcMain.handle(IpcChannels.Reviews.CountDue, () => ReviewsRepo.countDue());

  ipcMain.handle(
    IpcChannels.Reviews.Rate,
    (_e, { id, quality }: { id: number; quality: Quality }) => {
      ReviewsRepo.rate(id, quality);
      broadcast(IpcChannels.Events.ReviewsChanged, { id });
      capture('review_rated', { quality });
    }
  );

  ipcMain.handle(IpcChannels.Reviews.Finish, (_e, { id }: { id: number }) => {
    ReviewsRepo.finish(id);
    broadcast(IpcChannels.Events.ReviewsChanged, { id });
    broadcast(IpcChannels.Events.ProblemsChanged, { source: 'ui', action: 'updated', id });
  });
}
