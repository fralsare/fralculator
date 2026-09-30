import { useCalc } from '../store';

const KEYS: Array<{ label: string; insert?: string; op?: 'clear' | 'back' | 'equals'; cls?: string }> = [
  { label: 'sin(', insert: 'sin(', cls: 'fn' },
  { label: 'cos(', insert: 'cos(', cls: 'fn' },
  { label: 'tan(', insert: 'tan(', cls: 'fn' },
  { label: '√', insert: 'sqrt(', cls: 'fn' },
  { label: 'x²', insert: '^2', cls: 'fn' },
  { label: 'x^y', insert: '^', cls: 'fn' },
  { label: 'π', insert: 'π', cls: 'fn' },
  { label: '÷', insert: '/', cls: 'op' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '×', insert: '*', cls: 'op' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '−', insert: '-', cls: 'op' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '+', insert: '+', cls: 'op' },
  { label: '(', insert: '(' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
  { label: '%', insert: '%' },
  { label: 'C', op: 'clear' },
  { label: '⌫', op: 'back' },
  { label: 'e', insert: 'e', cls: 'fn' },
  { label: '=', op: 'equals', cls: 'eq' },
];

export function Keypad({ onEquals }: { onEquals: () => void }) {
  const append = useCalc((s) => s.append);
  const backspace = useCalc((s) => s.backspace);
  const clearAll = useCalc((s) => s.clearAll);

  const press = (k: (typeof KEYS)[number]) => {
    if (k.op === 'equals') onEquals();
    else if (k.op === 'clear') clearAll();
    else if (k.op === 'back') backspace();
    else if (k.insert) append(k.insert);
  };

  return (
    <div className="keypad">
      {KEYS.map((k) => (
        <button key={k.label} className={k.cls ? `key ${k.cls}` : 'key'} onClick={() => press(k)}>
          {k.label}
        </button>
      ))}
    </div>
  );
}
