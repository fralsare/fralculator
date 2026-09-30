import { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { useCalc } from '../store';
import { calculate } from '../math/engine';

export function Graph({ expression }: { expression: string }) {
  const angleMode = useCalc((s) => s.angleMode);
  const [expr, setExpr] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const active = expr.trim() ? expr : expression.trim() || 'sin(x) * x';

  useEffect(() => {
    if (!ref.current) return;
    const xs: number[] = [];
    const ys: (number | null)[] = [];
    const N = 600;
    const a = -10, b = 10;
    for (let i = 0; i <= N; i++) {
      const x = a + ((b - a) * i) / N;
      xs.push(x);
      try {
        const { value } = calculate(active, { x }, angleMode);
        ys.push(Number.isFinite(value) ? value : null);
      } catch {
        ys.push(null);
      }
    }

    const isDark = document.documentElement.dataset.theme === 'dark';
    const grid = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const txt = isDark ? '#eef1f8' : '#1a2233';

    Plotly.react(
      ref.current,
      [
        {
          x: xs,
          y: ys,
          type: 'scatter',
          mode: 'lines',
          line: { width: 2.5, color: 'rgb(79,124,255)' },
          connectgaps: false,
          name: active,
        },
      ],
      {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: txt, size: 12 },
        xaxis: { gridcolor: grid, zerolinecolor: grid },
        yaxis: { gridcolor: grid, zerolinecolor: grid },
        margin: { l: 46, r: 12, t: 28, b: 34 },
        showlegend: false,
        hovermode: 'x unified',
      },
      { displayModeBar: false },
    );
  }, [active, angleMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="graph-controls">
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="f(x) — e.g. sin(x) * x, x^2 - 4"
          spellCheck={false}
        />
      </div>
      <div ref={ref} className="plot" />
    </div>
  );
}
