import { i18n } from './index';

const localeOf = (): string => i18n.language || 'en';

export function formatMonthLong(d: Date): string {
  return new Intl.DateTimeFormat(localeOf(), { month: 'long', year: 'numeric' }).format(d);
}

export function formatDateLong(d: Date): string {
  return new Intl.DateTimeFormat(localeOf(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat(localeOf(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatRelativeDays(days: number): string {
  return new Intl.RelativeTimeFormat(localeOf(), { numeric: 'auto' }).format(-days, 'day');
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(localeOf()).format(n);
}
