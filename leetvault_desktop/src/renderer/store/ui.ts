import { create } from 'zustand';
import type { Lang } from '@shared/lang';
import { LANGUAGE_SETTING_KEY } from '@shared/lang';
import { i18n } from '../i18n';

export type View = 'problems' | 'review' | 'stats' | 'roadmap' | 'interview' | 'help' | 'settings';

export type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';
export type StatusFilter = 'all' | 'Solved' | 'In Progress' | 'To Review';

interface UiState {
  view: View;
  setView: (v: View) => void;

  language: Lang;
  setLanguage: (lang: Lang) => Promise<void>;

  search: string;
  setSearch: (s: string) => void;

  difficulty: DifficultyFilter;
  setDifficulty: (d: DifficultyFilter) => void;

  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;

  pattern: string;
  setPattern: (p: string) => void;

  formOpenId: number | 'new' | null;
  openCreate: () => void;
  openEdit: (id: number) => void;
  closeForm: () => void;

  deleteId: number | null;
  openDelete: (id: number) => void;
  closeDelete: () => void;

  goToProblemsWithPattern: (pattern: string) => void;
}

const initialLanguage: Lang = (window.lv?.app?.initialLocale ?? 'en') as Lang;

export const useUi = create<UiState>((set) => ({
  view: 'problems',
  setView: (v) => {
    set({ view: v });
    void window.lv?.analytics?.viewOpened?.(v);
  },

  language: initialLanguage,
  setLanguage: async (lang) => {
    set({ language: lang });
    await i18n.changeLanguage(lang);
    await window.lv.settings.set(LANGUAGE_SETTING_KEY, lang);
    await window.lv.app.localeChanged(lang);
  },

  search: '',
  setSearch: (s) => set({ search: s }),

  difficulty: 'all',
  setDifficulty: (d) => set({ difficulty: d }),

  status: 'all',
  setStatus: (s) => set({ status: s }),

  pattern: '',
  setPattern: (p) => set({ pattern: p }),

  formOpenId: null,
  openCreate: () => set({ formOpenId: 'new' }),
  openEdit: (id) => set({ formOpenId: id }),
  closeForm: () => set({ formOpenId: null }),

  deleteId: null,
  openDelete: (id) => set({ deleteId: id }),
  closeDelete: () => set({ deleteId: null }),

  goToProblemsWithPattern: (pattern) =>
    set({ view: 'problems', pattern, search: '', difficulty: 'all', status: 'all' }),
}));
