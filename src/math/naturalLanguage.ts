// Lightweight local natural-language layer.
// No API, no model download: a compact rule engine that turns common phrasings
// ("what is 15% of 240", "convert 72 fahrenheit to celsius",
//  "two hundred and fifty times three") into expression language.
// Swap-in point for @xenova/transformers later: implement `NLBackend`.

export interface NLResult {
  /** Expression to feed into the engine */
  expression: string;
  /** Human note explaining what was understood */
  note: string;
}

const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine'];
const TEENS = ['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','ten','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

function wordNumber(words: string[]): number | null {
  let total = 0;
  let group = 0;
  let i = 0;
  while (i < words.length) {
    const w = words[i];
    if (w === 'million') { group = (group === 0 ? 1 : group) * 1_000_000; i++; continue; }
    if (w === 'thousand') { group = (group === 0 ? 1 : group) * 1_000; i++; continue; }
    if (w === 'hundred') { group = (group === 0 ? 1 : group) * 100; i++; continue; }
    if (w === 'and' || w === '-') { i++; continue; }
    if (w === 'a') { group += 1; i++; continue; }
    if (w === 'a') { group += 1; i++; continue; } // "a hundred" = 100
    const oneIdx = ONES.indexOf(w);
    if (oneIdx >= 0) { group += oneIdx; i++; continue; }
    const teenIdx = TEENS.indexOf(w);
    if (teenIdx >= 0) { group += teenIdx; i++; continue; }
    const tenIdx = TENS.indexOf(w);
    if (tenIdx >= 0) {
      if (i + 1 < words.length && ONES.includes(words[i + 1])) {
        group += tenIdx * 10 + ONES.indexOf(words[i + 1]);
        i += 2;
      } else {
        group += tenIdx * 10;
        i++;
      }
      continue;
    }
    return null;
  }
  return group > 0 ? total + group : total > 0 ? total : null;
}

/** Convert a span of words like "two hundred and fifty" to 250, else null. */
function tryWordNumber(words: string[]): { value: number; count: number } | null {
  for (let len = words.length; len >= 1; len--) {
    const v = wordNumber(words.slice(0, len));
    if (v !== null) return { value: v, count: len };
  }
  return null;
}

export function parseNaturalLanguage(raw: string): NLResult | null {
  let text = raw
    .toLowerCase()
    .replace(/[?!]/g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  text = text
    .replace(/^what is\s+/i, '')
    .replace(/^calculate\s+/i, '')
    .replace(/^how much is\s+/i, '')
    .replace(/^solve\s+/i, '');

  const words = text.split(' ');

  // "15% of 240" / "15 percent of 240"
  let m = text.match(/^([\d.]+)\s*(?:percent|%)\s*of\s+([\d.]+)$/);
  if (m) {
    return { expression: `${m[1]}% × ${m[2]}`, note: `${m[1]} percent of ${m[2]}` };
  }

  // "square root of 144"
  m = text.match(/^square root of\s+([\d.]+)$/);
  if (m) return { expression: `sqrt(${m[1]})`, note: `Square root of ${m[1]}` };

  // "X squared" / "X cubed"
  m = text.match(/^([\d.]+)\s+squared$/);
  if (m) return { expression: `(${m[1]})^2`, note: `${m[1]} squared` };
  m = text.match(/^([\d.]+)\s+cubed$/);
  if (m) return { expression: `(${m[1]})^3`, note: `${m[1]} cubed` };
  {
    const pp = text.split(/to the power of/);
    if (pp.length === 2) {
      const a = resolveOperand(pp[0].trim(), words, text, /x/);
      const b = resolveOperand(pp[1].trim(), words, text, /x/);
      if (a !== null && b !== null) {
        return { expression: `(${a})^${b}`, note: `${a} to the power ${b}` };
      }
    }
  }

  // "X plus/minus/times/plus/divided by Y" (numbers may be words)
  const ops: Array<[RegExp, string, string]> = [
    [/\bdivided by\b/, '÷', 'divide'],
    [/\bdivided by\b|by\b/, '÷', 'divide'],
    [/\btimes\b|multiplied by\b|\bx\b/, '×', 'multiply'],
    [/\bplus\b|\bpls\b/, '+', 'add'],
    [/\bminus\b|\bmin\b/, '−', 'subtract'],
  ];
  for (const [re, sym, verb] of ops) {
    const parts = text.split(re);
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      const a = resolveOperand(parts[0].trim(), words, text, re);
      const b = resolveOperand(parts[1].trim(), words, text, re);
      if (a !== null && b !== null) {
        return { expression: `${a} ${sym} ${b}`, note: `“${raw.trim()}” → ${verb}` };
      }
    }
  }

  // "convert 72 fahrenheit to celsius" / "72 fahrenheit to celsius"
  m = text.match(/^(?:convert\s+)?([\d.]+)\s+([a-z ]+?)\s+to\s+([a-z ]+)$/);
  if (m) {
    const from = m[2].trim();
    const to = m[3].trim();
    const known = ['fahrenheit','celsius','kelvin','feet','miles','kilometers','kilometres','meters','metres','miles','yards','pounds','kilograms','grams','liters','litres','gallons','meters per second','kilometers per hour'];
    if (known.includes(from) && known.includes(to)) {
      return {
        expression: `__convert__ ${m[1]} ${from} ${to}`,
        note: `Convert ${m[1]} ${from} to ${to} (open the Units panel)`,
      };
    }
  }

  // Fallback: symbolize ("×" → *, "÷" → /, remove spaces, "pi" stays)
  const symbolized = raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/−/g, '-')
    .replace(/[\s]+/g, '');
  if (/^[0-9+\-*/^().a-z%π]+$/.test(symbolized)) {
    return { expression: symbolized, note: 'Interpreted directly as an expression' };
  }

  return null;
}

function resolveOperand(
  chunk: string,
  _words: string[],
  _full: string,
  _re: RegExp,
): string | null {
  // numeric chunk
  if (/^[\d.]+$/.test(chunk)) return chunk;
  // word number chunk
  const wn = tryWordNumber(chunk.split(' '));
  if (wn) return String(wn.value);
  // constant or simple symbolic
  if (/^(pi|e|tau)$/.test(chunk)) return chunk;
  return null;
}

export interface NLBackend {
  id: string;
  label: string;
  parse(text: string): Promise<NLResult | null> | null;
}

/**
 * Backend registry. The built-in rules engine runs instantly and offline.
 * A WASM transformer (e.g. @xenova/transformers) can be registered here
 * without touching UI code.
 */
export const backends: NLBackend[] = [
  {
    id: 'rules',
    label: 'Local rules (offline)',
    parse(text) {
      const r = parseNaturalLanguage(text);
      return Promise.resolve(r);
    },
  },
];
