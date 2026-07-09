import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '@shared/lang';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import enSettings from './locales/en/settings.json';
import esSettings from './locales/es/settings.json';
import enStats from './locales/en/stats.json';
import esStats from './locales/es/stats.json';
import enProblems from './locales/en/problems.json';
import esProblems from './locales/es/problems.json';
import enReview from './locales/en/review.json';
import esReview from './locales/es/review.json';
import enRoadmap from './locales/en/roadmap.json';
import esRoadmap from './locales/es/roadmap.json';
import enChrome from './locales/en/chrome.json';
import esChrome from './locales/es/chrome.json';
import enHelp from './locales/en/help.json';
import esHelp from './locales/es/help.json';
import enDonate from './locales/en/donate.json';
import esDonate from './locales/es/donate.json';

export const NAMESPACES = [
  'common',
  'settings',
  'stats',
  'problems',
  'review',
  'roadmap',
  'chrome',
  'help',
  'donate',
] as const;

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    stats: enStats,
    problems: enProblems,
    review: enReview,
    roadmap: enRoadmap,
    chrome: enChrome,
    help: enHelp,
    donate: enDonate,
  },
  es: {
    common: esCommon,
    settings: esSettings,
    stats: esStats,
    problems: esProblems,
    review: esReview,
    roadmap: esRoadmap,
    chrome: esChrome,
    help: esHelp,
    donate: esDonate,
  },
};

const initial = (window.lv?.app?.initialLocale ?? 'en') as Lang;

void i18next.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: 'en',
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18next as i18n };
