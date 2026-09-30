import { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { explain } from '../ai/explain';

export function Steps({ steps, value, expression }: { steps: string[]; value: number | null; expression: string }) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => steps, [steps]);

  const onExplain = async () => {
    if (value === null) return;
    setBusy(true);
    try {
      setExplanation(await explain(expression, String(value), steps));
    } finally {
      setBusy(false);
    }
  };

  if (steps.length === 0 && value === null) {
    return <div className="empty">Enter an expression to see each step of the solution.</div>;
  }
  if (steps.length === 0) {
    return <div className="empty">A single-step computation — the answer appears directly above the keypad.</div>;
  }

  return (
    <div>
      <div className="step-list">
        {items.map((s, i) => (
          <div className="step" key={i} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="n">{i + 1}</div>
            <Katex tex={toTex(s)} />
          </div>
        ))}
        {value !== null && (
          <div className="step final">
            <div className="n">✓</div>
            <Katex tex={`\\boxed{= ${formatStep(value)}}`} />
          </div>
        )}
      </div>
      <button className="explain-btn" onClick={onExplain} disabled={busy || value === null}>
        {busy ? 'Explaining…' : '✦ Explain This in plain English'}
      </button>
      {explanation && <div className="explain-text">{explanation}</div>}
    </div>
  );
}

/** Render TeX into a span via the KaTeX DOM API (no innerHTML injection path). */
function Katex({ tex }: { tex: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(tex, ref.current, { throwOnError: false });
    } catch {
      ref.current.textContent = tex; // safe plain-text fallback
    }
  }, [tex]);
  return <span ref={ref} className="math" />;
}

/** Light math-ify so KaTeX renders cleanly. */
function toTex(s: string): string {
  return s
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/−/g, '-')
    .replace(/sqrt\(/g, '\\sqrt{')
    .replace(/π/g, '\\pi')
    .replace(/\^/g, '^{')
    .replace(/\^([\d.]+)\s/g, '^{$1}')
    .replace(/([\d.]+)$|\^([\d.]+)$/, (_m, a, b) => (a ? `${a}` : `^{${b}}`));
}

function formatStep(v: number): string {
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) return v.toExponential(8);
  return String(parseFloat(v.toPrecision(12)));
}
