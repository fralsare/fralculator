import { useEffect, useMemo, useState } from 'react';
import { useCalc } from './store';
import { calculate, formatNumber } from './math/engine';
import { parseNaturalLanguage } from './math/naturalLanguage';
import { autocorrectTyped, autocorrectVoice } from './math/autocorrect';
import { runConversion } from './ai/explain';
import { Display } from './components/Display';
import { Keypad } from './components/Keypad';
import { Steps } from './components/Steps';
import { Cyber } from './components/Cyber';
import { Graph } from './components/Graph';
import { History } from './components/History';
import { UnitsDrawer } from './components/UnitsDrawer';
import { Header } from './components/Header';

const PALETTES = ['aurora', 'sunset', 'ocean', 'forest', 'candy', 'gold', 'mono', 'grape'];

function safeEvaluate(
  e: string,
  angleMode: 'deg' | 'rad',
): { value: number | null; steps: string[]; error: string | null } {
  const conv = e.match(/^__convert__\s+([\d.]+)\s+([a-z ]+)\s+([a-z ]+)$/);
  if (conv) {
    try {
      const { result, steps } = runConversion(parseFloat(conv[1]), conv[2], conv[3]);
      return { value: parseFloat(result), steps, error: null };
    } catch (err) {
      return { value: null, steps: [], error: (err as Error).message };
    }
  }
  try {
    const { value, steps } = calculate(e, {}, angleMode);
    return { value, steps, error: null };
  } catch (err) {
    return { value: null, steps: [], error: (err as Error).message };
  }
}

export function App() {
  const input = useCalc((s) => s.input);
  const commit = useCalc((s) => s.commit);
  const themeMode = useCalc((s) => s.themeMode);
  const palette = useCalc((s) => s.palette);
  const angleMode = useCalc((s) => s.angleMode);
  const rightTab = useCalc((s) => s.rightTab);
  const setRightTab = useCalc((s) => s.setRightTab);
  const [nlNote, setNlNote] = useState('');
  const [pendingNl, setPendingNl] = useState<string | null>(null);
  const [acNote, setAcNote] = useState<string | null>(null);
  const autocorrectOn = useCalc((s) => s.autocorrect);

  // Autocorrect the typed input (when enabled) and note what changed.
  const typed = useMemo(() => {
    if (!autocorrectOn || !input.trim()) return { fixed: input, note: null as string | null };
    const ac = autocorrectTyped(input);
    return { fixed: ac.fixed, note: ac.changes.length ? ac.changes.join(', ') : null };
  }, [input, autocorrectOn]);

  // A fresh keystroke in the main input means the NL/voice result is stale.
  useEffect(() => {
    setPendingNl(null);
  }, [input]);

  useEffect(() => {
    setAcNote(typed.note);
  }, [typed.note]);

  // theme application
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = themeMode === 'dark' || (themeMode === 'auto' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.dataset.palette = PALETTES.includes(palette) ? palette : 'aurora';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [themeMode, palette]);

  // evaluate current input (direct engine first, natural-language fallback on error)
  const evalState = useMemo(() => {
    const expr = pendingNl ?? typed.fixed;
    if (!expr.trim()) return { value: null as number | null, steps: [] as string[], error: null as string | null, nlNote: null as string | null };

    const evaluate = (e: string) => safeEvaluate(e, angleMode);

    const direct = evaluate(expr);
    if (!direct.error) return { ...direct, nlNote: null as string | null };

    // Fallback: the main input got words ("calculate 2 plus 10") — ask the NL engine.
    if (/[a-zA-Z]/.test(expr) && !/^__convert__/.test(expr)) {
      const nl = parseNaturalLanguage(expr);
      if (nl) {
        const viaNl = evaluate(nl.expression);
        if (!viaNl.error && viaNl.value !== null) {
          return { ...viaNl, nlNote: nl.note };
        }
      }
    }
    return { ...direct, nlNote: null as string | null };
  }, [typed.fixed, pendingNl, angleMode]);

  const handleEquals = () => {
    const expr = (pendingNl ?? typed.fixed).trim();
    if (!expr || evalState.error || evalState.value === null) return;
    const convMatch = expr.match(/^__convert__\s+([\d.]+)\s+([a-z ]+)\s+([a-z ]+)$/);
    const displayExpr = convMatch
      ? `${convMatch[1]} ${convMatch[2]} → ${convMatch[3]}`
      : expr;
    commit({
      expression: displayExpr,
      result: formatNumber(evalState.value),
      steps: evalState.steps,
      tags: [],
    });
    setPendingNl(null);
  };

  const handleNl = (text: string) => {
    const r = parseNaturalLanguage(text);
    if (!r) {
      setNlNote('Could not understand that — try "15% of 240" or "convert 72 fahrenheit to celsius".');
      return;
    }
    setPendingNl(r.expression);
    setNlNote(r.note);
    if (r.expression.startsWith('__convert__')) {
      useCalc.getState().setConversionRequest({
        value: r.expression.split(' ')[2],
        from: r.expression.split(' ')[3],
        to: r.expression.split(' ')[4],
      });
    }
  };

  const handleVoice = (text: string) => {
    // voice text is phrased naturally: "two hundred and fifty times three"
    let clean = text;
    if (autocorrectOn) clean = autocorrectVoice(text).fixed;
    const r = parseNaturalLanguage(clean);
    if (!r) {
      setNlNote('Could not understand that — try "15% of 240" or "convert 72 fahrenheit to celsius".');
      return;
    }
    setPendingNl(r.expression);
    setNlNote(r.note);
    if (r.expression.startsWith('__convert__')) {
      useCalc.getState().setConversionRequest({
        value: r.expression.split(' ')[2],
        from: r.expression.split(' ')[3],
        to: r.expression.split(' ')[4],
      });
    }
    // Voice calculations are committed to history immediately (tagged 'voice'),
    // so they don't depend on the user pressing Enter afterwards.
    const via = safeEvaluate(r.expression, angleMode);
    if (!via.error && via.value !== null) {
      commit({
        expression: `🎙 ${clean}`,
        result: formatNumber(via.value),
        steps: via.steps,
        tags: ['voice'],
      });
    }
  };

  return (
    <div className="app">
      <Header />
      <div className="main">
        <div className="panel">
          <Display
            error={evalState.error}
            value={evalState.value}
            stepsCount={evalState.steps.length}
            nlNote={nlNote}
            autoNote={acNote}
            interpretedAs={evalState.nlNote ? `Heard you as: ${evalState.nlNote}` : null}
            onNl={handleNl}
            onVoice={handleVoice}
            onEquals={handleEquals}
            hasPendingNl={pendingNl !== null}
            onCancelNl={() => setPendingNl(null)}
          />
          <Keypad onEquals={handleEquals} />
        </div>
        <div className="panel right-col">
          <div className="tabs">
            <button className={rightTab === 'steps' ? 'tab active' : 'tab'} onClick={() => setRightTab('steps')}>
              Steps
            </button>
            <button className={rightTab === 'graph' ? 'tab active' : 'tab'} onClick={() => setRightTab('graph')}>
              Graph
            </button>
            <button className={rightTab === 'history' ? 'tab active' : 'tab'} onClick={() => setRightTab('history')}>
              History
            </button>
            <button className={rightTab === 'cyber' ? 'tab active cyber-tab' : 'tab cyber-tab'} onClick={() => setRightTab('cyber')}>
              EHCalc
            </button>
          </div>
          <div className="tab-body">
            {rightTab === 'steps' && <Steps steps={evalState.steps} value={evalState.value} expression={pendingNl ?? typed.fixed} />}
            {rightTab === 'graph' && <Graph expression={input} />}
            {rightTab === 'history' && <History />}
            {rightTab === 'cyber' && <Cyber />}
          </div>
        </div>
      </div>
      <UnitsDrawer />
    </div>
  );
}
