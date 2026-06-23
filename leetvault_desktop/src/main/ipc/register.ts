import { registerImportIpc } from './import';
import { registerInterviewIpc } from './interview';
import { registerProblemsIpc } from './problems';
import { registerReviewsIpc } from './reviews';
import { registerSettingsIpc } from './settings';
import { registerStatsIpc } from './stats';
import { registerWindowIpc } from './window';
import { registerAnalyticsIpc } from './analytics';
import { registerUpdaterIpc } from './updater';

export function registerIpc(): void {
  registerProblemsIpc();
  registerReviewsIpc();
  registerStatsIpc();
  registerWindowIpc();
  registerImportIpc();
  registerSettingsIpc();
  registerInterviewIpc();
  registerAnalyticsIpc();
  registerUpdaterIpc();
}
