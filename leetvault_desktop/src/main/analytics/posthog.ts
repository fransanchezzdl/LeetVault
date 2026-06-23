import { PostHog } from 'posthog-node';
import { app } from 'electron';
import {
  getOrCreateIdentity,
  getDistinctId,
  isAnalyticsEnabled,
} from './identity';
import type { EventName, EventProps } from './events';

let client: PostHog | null = null;
let distinctId = '';
let baseProps: Record<string, string> = {};

function buildBaseProps(): Record<string, string> {
  return {
    app_version: __APP_VERSION__,
    os: process.platform,
    os_release: typeof process.getSystemVersion === 'function' ? process.getSystemVersion() : '',
    locale: app.getLocale(),
    arch: process.arch,
  };
}

export function initAnalytics(): void {
  if (!__POSTHOG_KEY__ || !__POSTHOG_HOST__) return;
  if (!isAnalyticsEnabled()) return;
  if (client) return;

  distinctId = getOrCreateIdentity();
  baseProps = buildBaseProps();

  client = new PostHog(__POSTHOG_KEY__, {
    host: __POSTHOG_HOST__,
    flushAt: 20,
    flushInterval: 10_000,
  });
}

export function capture<E extends EventName>(event: E, props?: EventProps[E]): void {
  if (!client) return;
  client.capture({
    distinctId,
    event,
    properties: { ...baseProps, ...(props ?? {}) },
  });
}

export async function shutdownAnalytics(): Promise<void> {
  if (!client) return;
  try {
    await client.shutdown();
  } catch {
    // Network errors on shutdown shouldn't block app exit.
  }
  client = null;
}

export async function disableAnalytics(): Promise<void> {
  if (client) {
    try {
      client.capture({
        distinctId,
        event: 'analytics_opted_out',
        properties: baseProps,
      });
      await client.shutdown();
    } catch {
      // best-effort
    }
    client = null;
  }
}

export function enableAnalytics(): void {
  if (client) return;
  if (!__POSTHOG_KEY__ || !__POSTHOG_HOST__) return;

  distinctId = getDistinctId() ?? getOrCreateIdentity();
  baseProps = buildBaseProps();

  client = new PostHog(__POSTHOG_KEY__, {
    host: __POSTHOG_HOST__,
    flushAt: 20,
    flushInterval: 10_000,
  });
}

export function isAnalyticsActive(): boolean {
  return client !== null;
}
