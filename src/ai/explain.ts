// "Explain This" — plain-English, real-life explanations.
// Rule-based by default (offline, instant). A local LLM backend can be
// registered through `aiBackends` later without UI changes.

import { CATEGORIES } from '../units/data';
import { formatNumber } from '../math/engine';

export interface ExplainBackend {
  id: string;
  label: string;
  available: () => boolean;
  explain(input: string, result: string, steps: string[]): Promise<string>;
}

function ruleExplain(input: string, result: string, steps: string[]): string {
  const expr = input.trim();
  const out = formatNumber(parseFloat(result));

  const pct = expr.match(/^([\d.]+)% × ([\d.]+)$/);
  if (pct) {
    return `${out} is what you get when you take ${pct[1]} out of every 100 parts of ${pct[2]}. ` +
      `In everyday life: if something costs $${pct[2]} and has a ${pct[1]}% discount, ` +
      `the discount is worth $${out} — you'd pay $${formatNumber(parseFloat(pct[2]) - parseFloat(out))}.`;
  }
  if (/sqrt\(/.test(expr)) {
    return `${out}² equals ${formatNumber(parseFloat(result) ** 2)} — ${out} is the length of one side of a square whose area is ${expr.replace('sqrt(', '').replace(')', '')}.`;
  }

  const op = expr.match(/^(.+?)\s([+−×÷^])\s(.+)$/);
  if (op) {
    const examples: Record<string, string> = {
      '+': `This adds the two quantities: combining ${prettyPart(op[1])} and ${prettyPart(op[3])} gives a total of ${out}. Think of money: $${prettyPart(op[1])} + $${prettyPart(op[3])} = $${out}.`,
      '−': `This is the difference between ${prettyPart(op[1])} and ${prettyPart(op[3])}, which is ${out}. Think of it as what remains after removing ${prettyPart(op[3])} from ${prettyPart(op[1])}.`,
      '×': `Multiplication is repeated addition: ${prettyPart(op[1])} × ${prettyPart(op[3])} means ${prettyPart(op[1])} groups of ${prettyPart(op[3])}, totaling ${out}. Example: ${prettyPart(op[1])} items at $${prettyPart(op[3])} each cost $${out}.`,
      '÷': `Division splits ${prettyPart(op[1])} into ${prettyPart(op[3])} equal shares — each share is ${out}. Example: sharing $${prettyPart(op[1])} between ${prettyPart(op[3])} people gives each person $${out}.`,
      '^': `This raises ${prettyPart(op[1])} to the power ${prettyPart(op[3])}: multiplying ${prettyPart(op[1])} by itself ${prettyPart(op[3])} times. Powers model exponential growth — e.g. doubling over time.`,
    };
    const text = examples[op[2]];
    if (text) {
      return text + (steps.length ? `\n\nIt took ${steps.length} intermediate step${steps.length > 1 ? 's' : ''} to get here.` : '');
    }
  }

  const m = expr.match(/^(sin|cos|tan)\((.+)\)$/);
  if (m) {
    const ref: Record<string, string> = {
      sin: 'the ratio of the opposite side to the hypotenuse in a right triangle',
      cos: 'the ratio of the adjacent side to the hypotenuse in a right triangle',
      tan: 'the slope of a line rising at that angle',
    };
    return `${m[1]}(${m[2]}) = ${out}. In geometry, ${m[1]} measures ${ref[m[1]]}. ` +
      `Trigonometry underpins waves, music, orbits, and engineering.`;
  }

  return `The expression “${expr}” evaluates to ${out}. ` +
    (steps.length
      ? `Each of the ${steps.length} intermediate steps above shows the order of operations (PEMDAS/BODMAS) applied: parentheses → powers → multiplication/division → addition/subtraction.`
      : 'It is a single-step computation, so there are no intermediates.');
}

function prettyPart(s: string): string {
  return s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/\s+/g, ' ').trim();
}

export const aiBackends: ExplainBackend[] = [
  {
    id: 'rules',
    label: 'Built-in explainer (offline)',
    available: () => true,
    explain: async (input, result, steps) => ruleExplain(input, result, steps),
  },
];

/** Convenience: run the best available backend. */
export async function explain(input: string, result: string, steps: string[]): Promise<string> {
  const backend = aiBackends.find((b) => b.available()) ?? aiBackends[0];
  return backend.explain(input, result, steps);
}

/** Convert request produced by the NL engine, executed here so history shows it. */
export function runConversion(value: number, fromName: string, toName: string): { result: string; steps: string[] } {
  const cat =
    CATEGORIES.find((c) =>
      c.units.some((u) => u.name.toLowerCase() === fromName) &&
      c.units.some((u) => u.name.toLowerCase() === toName),
    ) ?? CATEGORIES.find((c) => c.name.toLowerCase().includes(fromName)) ?? null;
  if (!cat) throw new Error(`No unit category for "${fromName}"`);
  const from = cat.units.find((u) => u.name.toLowerCase() === fromName);
  const to = cat.units.find((u) => u.name.toLowerCase() === toName);
  if (!from || !to) throw new Error(`Unknown unit: ${!from ? fromName : toName}`);
  const base = from.toBase(value);
  const result = to.fromBase(base);
  const steps = [
    `${value} ${from.name} = ${formatNumber(base)} ${cat.base} (base unit)`,
    `${formatNumber(base)} ${cat.base} = ${formatNumber(result)} ${to.name}`,
  ];
  return { result: formatNumber(result), steps };
}
