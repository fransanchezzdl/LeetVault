import { app } from 'electron';
import type { UpdateInfo } from '@shared/types/updater';
import { SettingsRepo } from '../db/settings.repo';
import { fetchLatestRelease } from './github';
import { compareVersions } from './semver';

const OWNER = 'fransanchezzdl';
const REPO = 'LeetVault';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SNOOZE_MS = 24 * 60 * 60 * 1000;

const LAST_CHECK_KEY = 'last_update_check_at';
const LATEST_SEEN_KEY = 'latest_version_seen';
const DISMISSED_KEY = 'update_dismissed_for';

interface CachedRelease {
  tag: string;
  url: string;
  notes: string;
}

let cached: CachedRelease | null = null;

function readSnooze(): { version: string; at: number } | null {
  const raw = SettingsRepo.get(DISMISSED_KEY);
  if (!raw) return null;
  const idx = raw.indexOf(':');
  if (idx < 0) return null;
  const version = raw.slice(0, idx);
  const at = Date.parse(raw.slice(idx + 1));
  if (!Number.isFinite(at)) return null;
  return { version, at };
}

function isSnoozed(latest: string): boolean {
  const snooze = readSnooze();
  if (!snooze) return false;
  if (snooze.version !== latest) return false;
  return Date.now() - snooze.at < SNOOZE_MS;
}

function buildResult(release: CachedRelease, current: string): UpdateInfo | null {
  if (compareVersions(release.tag, current) !== 1) return null;
  if (isSnoozed(release.tag.replace(/^v/, ''))) return null;
  return {
    current,
    latest: release.tag.replace(/^v/, ''),
    url: release.url,
    notes: release.notes,
  };
}

export async function checkForUpdates(opts?: { force?: boolean }): Promise<UpdateInfo | null> {
  const current = app.getVersion();

  const lastCheckRaw = SettingsRepo.get(LAST_CHECK_KEY);
  const lastCheck = lastCheckRaw ? Date.parse(lastCheckRaw) : 0;
  const fresh = Number.isFinite(lastCheck) && Date.now() - lastCheck < CHECK_INTERVAL_MS;

  if (!opts?.force && fresh && cached) {
    return buildResult(cached, current);
  }

  if (!opts?.force && fresh && !cached) {
    const cachedTag = SettingsRepo.get(LATEST_SEEN_KEY);
    if (cachedTag) {
      const url = `https://github.com/${OWNER}/${REPO}/releases/tag/${cachedTag}`;
      cached = { tag: cachedTag, url, notes: '' };
      return buildResult(cached, current);
    }
    return null;
  }

  const release = await fetchLatestRelease(OWNER, REPO);

  if (!release) {
    // Don't advance LAST_CHECK_KEY on failure — otherwise a single transient
    // outage would lock the user out of update checks for 24 h.
    return cached ? buildResult(cached, current) : null;
  }

  SettingsRepo.set(LAST_CHECK_KEY, new Date().toISOString());
  SettingsRepo.set(LATEST_SEEN_KEY, release.tag_name);
  cached = { tag: release.tag_name, url: release.html_url, notes: release.body };
  return buildResult(cached, current);
}

export function snoozeUpdate(version: string): void {
  SettingsRepo.set(DISMISSED_KEY, `${version}:${new Date().toISOString()}`);
}

export function clearSnooze(): void {
  SettingsRepo.clear(DISMISSED_KEY);
}
