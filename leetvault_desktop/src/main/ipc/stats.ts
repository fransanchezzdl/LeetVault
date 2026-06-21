import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import { StatsRepo } from '../db/stats.repo';

export function registerStatsIpc(): void {
  ipcMain.handle(IpcChannels.Stats.Bundle, () => StatsRepo.bundle());
}
