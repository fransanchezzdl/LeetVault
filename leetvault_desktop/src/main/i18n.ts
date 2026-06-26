import { app } from 'electron';
import { SettingsRepo } from './db/settings.repo';
import { LANGUAGE_SETTING_KEY, normalizeLang, type Lang } from '@shared/lang';
import en from './locales/en.json';
import es from './locales/es.json';

type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = { en: en as Dict, es: es as Dict };

let currentLang: Lang = 'en';

export function initMainI18n(): Lang {
  currentLang = resolveLang();
  return currentLang;
}

export function resolveLang(): Lang {
  const stored = SettingsRepo.get(LANGUAGE_SETTING_KEY);
  if (stored === 'en' || stored === 'es') return stored;
  const sys = normalizeLang(app.getLocale());
  SettingsRepo.set(LANGUAGE_SETTING_KEY, sys);
  return sys;
}

export function setMainLang(lang: Lang): void {
  currentLang = lang;
}

export function getMainLang(): Lang {
  return currentLang;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[currentLang] ?? DICTS.en;
  let str = dict[key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
    }
  }
  return str;
}
