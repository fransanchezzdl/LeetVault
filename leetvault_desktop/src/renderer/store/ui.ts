import { create } from 'zustand';

export type View = 'problems' | 'review' | 'stats' | 'roadmap' | 'interview' | 'help';

export type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';
export type StatusFilter = 'all' | 'Solved' | 'In Progress' | 'To Review';

interface UiState {
  view: View;
  setView: (v: View) => void;

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

export const useUi = create<UiState>((set) => ({
  view: 'problems',
  setView: (v) => set({ view: v }),

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
