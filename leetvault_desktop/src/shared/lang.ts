export type Lang = 'en' | 'es';

export const SUPPORTED_LANGS: readonly Lang[] = ['en', 'es'] as const;

export function normalizeLang(input: string | null | undefined): Lang {
  if (!input) return 'en';
  return input.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export const LANGUAGE_SETTING_KEY = 'ui_language';
