import { useCalc } from './store';

export const PALETTES = [
  { id: 'aurora', name: 'Aurora', accent: '#4f7cff', accent2: '#9b5cff' },
  { id: 'sunset', name: 'Sunset', accent: '#ff7a59', accent2: '#ffb545' },
  { id: 'ocean', name: 'Ocean', accent: '#22b8cf', accent2: '#4f7cff' },
  { id: 'forest', name: 'Forest', accent: '#3fb950', accent2: '#2ea88c' },
  { id: 'candy', name: 'Candy', accent: '#f472b6', accent2: '#a78bfa' },
  { id: 'gold', name: 'Gold', accent: '#e3b341', accent2: '#d97706' },
  { id: 'mono', name: 'Mono', accent: '#cbd5e1', accent2: '#94a3b8' },
  { id: 'grape', name: 'Grape', accent: '#a78bfa', accent2: '#f472b6' },
] as const;

export function applyTheme() {
  const { themeMode, palette } = useCalc.getState();
  const dark =
    themeMode === 'dark' ||
    (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const p = PALETTES.find((x) => x.id === palette) ?? PALETTES[0];
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.palette = p.id;
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--accent-2', p.accent2);
}

useCalc.subscribe(applyTheme);
