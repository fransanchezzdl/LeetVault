import { v4 as uuidv4 } from 'uuid';
import { SettingsRepo } from '../db/settings.repo';

const DISTINCT_ID_KEY = 'distinct_id';
const ANALYTICS_ENABLED_KEY = 'analytics_enabled';
const FIRST_LAUNCH_KEY = 'first_launch_seen';

export function getOrCreateIdentity(): string {
  const existing = SettingsRepo.get(DISTINCT_ID_KEY);
  if (existing) return existing;
  const fresh = uuidv4();
  SettingsRepo.set(DISTINCT_ID_KEY, fresh);
  return fresh;
}

export function getDistinctId(): string | null {
  return SettingsRepo.get(DISTINCT_ID_KEY);
}

// Default: enabled (opt-out). Only an explicit 'false' string disables.
export function isAnalyticsEnabled(): boolean {
  const v = SettingsRepo.get(ANALYTICS_ENABLED_KEY);
  if (v === null) return true;
  return v !== 'false';
}

export function setAnalyticsEnabled(enabled: boolean): void {
  SettingsRepo.set(ANALYTICS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function isFirstLaunch(): boolean {
  return !SettingsRepo.has(FIRST_LAUNCH_KEY);
}

export function markFirstLaunchSeen(): void {
  SettingsRepo.set(FIRST_LAUNCH_KEY, new Date().toISOString());
}
