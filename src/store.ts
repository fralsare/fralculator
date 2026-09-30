import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AngleMode } from './math/engine';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  steps: string[];
  tags: string[];
  ts: number;
}

export type ThemeMode = 'light' | 'dark' | 'auto';
export type RightTab = 'steps' | 'graph' | 'history' | 'cyber';

export interface CalcState {
  input: string;
  setInput: (v: string) => void;
  append: (v: string) => void;
  backspace: () => void;
  clearAll: () => void;
  commit: (entry: Omit<HistoryEntry, 'id' | 'ts'>) => void;

  history: HistoryEntry[];
  search: string;
  setSearch: (v: string) => void;
  deleteEntry: (id: string) => void;
  clearHistory: () => void;
  setTags: (id: string, tags: string[]) => void;

  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  palette: string;
  setPalette: (p: string) => void;

  angleMode: AngleMode;
  setAngleMode: (m: AngleMode) => void;

  autocorrect: boolean;
  setAutocorrect: (b: boolean) => void;

  rightTab: RightTab;
  setRightTab: (t: RightTab) => void;
  unitsOpen: boolean;
  setUnitsOpen: (b: boolean) => void;
  conversionRequest: { value: string; from: string; to: string } | null;
  setConversionRequest: (r: CalcState['conversionRequest']) => void;
}

export const useCalc = create<CalcState>()(
  persist(
    (set) => ({
      input: '',
      setInput: (v) => set({ input: v }),
      append: (v) => set((s) => ({ input: s.input + v })),
      backspace: () => set((s) => ({ input: s.input.slice(0, -1) })),
      clearAll: () => set({ input: '' }),
      commit: (entry) =>
        set((s) => ({
          history: [
            { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now() },
            ...s.history,
          ].slice(0, 500),
        })),

      history: [],
      search: '',
      setSearch: (v) => set({ search: v }),
      deleteEntry: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      clearHistory: () => set({ history: [], search: '' }),
      setTags: (id, tags) =>
        set((s) => ({ history: s.history.map((h) => (h.id === id ? { ...h, tags } : h)) })),

      themeMode: 'auto',
      setThemeMode: (m) => set({ themeMode: m }),
      palette: 'aurora',
      setPalette: (p) => set({ palette: p }),

      angleMode: 'deg',
      setAngleMode: (m) => set({ angleMode: m }),

      autocorrect: true,
      setAutocorrect: (b) => set({ autocorrect: b }),

      rightTab: 'steps',
      setRightTab: (t) => set({ rightTab: t }),
      unitsOpen: false,
      setUnitsOpen: (b) => set({ unitsOpen: b }),
      conversionRequest: null,
      setConversionRequest: (r) => set({ conversionRequest: r, unitsOpen: true, rightTab: 'steps' }),
    }),
    {
      name: 'fralculator',
      partialize: (s) => ({
        history: s.history,
        themeMode: s.themeMode,
        palette: s.palette,
        angleMode: s.angleMode,
        autocorrect: s.autocorrect,
      }),
    },
  ),
);
