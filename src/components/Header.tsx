import { useCalc } from '../store';
import type { ThemeMode } from '../store';

const PALETTES = ['aurora', 'sunset', 'ocean', 'forest', 'candy', 'gold', 'mono', 'grape'];

export function Header() {
  const themeMode = useCalc((s) => s.themeMode);
  const setThemeMode = useCalc((s) => s.setThemeMode);
  const palette = useCalc((s) => s.palette);
  const setPalette = useCalc((s) => s.setPalette);
  const angleMode = useCalc((s) => s.angleMode);
  const setAngleMode = useCalc((s) => s.setAngleMode);
  const setUnitsOpen = useCalc((s) => s.setUnitsOpen);
  const unitsOpen = useCalc((s) => s.unitsOpen);
  const autocorrect = useCalc((s) => s.autocorrect);
  const setAutocorrect = useCalc((s) => s.setAutocorrect);

  return (
    <header className="header">
      <span className="logo">◈ Fralculator</span>
      <span className="spacer" />
      <select value={angleMode} onChange={(e) => setAngleMode(e.target.value as 'deg' | 'rad')} title="Trig angle mode">
        <option value="deg">DEG</option>
        <option value="rad">RAD</option>
      </select>
      <select value={themeMode} onChange={(e) => setThemeMode(e.target.value as ThemeMode)} title="Theme">
        <option value="auto">Auto theme</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
      <select value={palette} onChange={(e) => setPalette(e.target.value)} title="Color palette">
        {PALETTES.map((p) => (
          <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
        ))}
      </select>
      <button className={unitsOpen ? 'icon-btn active' : 'icon-btn'} onClick={() => setUnitsOpen(!unitsOpen)} title="Unit & currency conversion">
        ⇄ Convert
      </button>
      <button
        className={autocorrect ? 'icon-btn active' : 'icon-btn'}
        onClick={() => setAutocorrect(!autocorrect)}
        title={autocorrect ? 'Autocorrect is ON — fixes typos like 5x3, ++, missing ) in typed input and cleans voice transcripts. Click to turn off.' : 'Autocorrect is OFF. Click to turn on.'}
      >
        ✨ Auto-correct
      </button>
    </header>
  );
}
