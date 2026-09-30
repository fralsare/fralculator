// Light, safe autocorrection for typed expressions and voice transcripts.
// Every rule is conservative: it only rewrites patterns that are almost
// certainly typos, and reports each change so the UI can show what happened.

export interface AutocorrectResult {
  fixed: string;
  changes: string[];
}

/** Fix common typos in a typed math expression (letters like "x" aside). */
export function autocorrectTyped(raw: string): AutocorrectResult {
  const changes: string[] = [];
  let s = raw.trim();
  if (!s) return { fixed: s, changes };

  // "5x3" / "2 x 3" → multiplication (x must be a standalone letter, not part of a word)
  if (/(?<![a-zA-Z])(\d|\))\s*[xX]\s*(?=\d|\()/i.test(s)) {
    const next = s.replace(/(?<![a-zA-Z])(\d|\))\s*[xX]\s*(?=\d|\()/gi, '$1×');
    if (next !== s) { changes.push('x → ×'); s = next; }
  }
  if (/(\d|\))\s*\(/.test(s)) {
    const next = s.replace(/(\d|\))\s*\(/g, '$1×(');
    if (next !== s) { changes.push('implicit ×'); s = next; }
  }

  // "**" (python-style power) → "^"
  if (s.includes('**')) { changes.push('** → ^'); s = s.replace(/\*\*/g, '^'); }

  // Word shorthand: "6 pls 2" → "6 plus 2" (standalone words only)
  const WORDS: Array<[string, string]> = [
    ['pls', 'plus'], ['min', 'minus'], ['divided by', 'divided by'],
  ];
  for (const [from, to] of WORDS) {
    if (from === to) continue;
    const re = new RegExp(`\\b${from}\\b`, 'gi');
    const next = s.replace(re, to);
    if (next !== s) { changes.push(`${from} → ${to}`); s = next; }
  }

  // Duplicated operators: "2++3" → "2+3", "2//4" → "2/4"
  // (literal regexes — building `(+){2,}` dynamically throws "Nothing to repeat")
  const DUPES: Array<[string, RegExp]> = [
    ['+', /\+{2,}/], ['*', /\*{2,}/], ['/', /\/{2,}/], ['^', /\^{2,}/],
  ];
  for (const [op, re] of DUPES) {
    if (re.test(s)) { changes.push(`duplicate ${op} removed`); s = s.replace(re, op); }
  }
  // "2--3" → "2+3" only when it sits between two operands
  if (/(\d)\s*--\s*(\d|\()/.test(s)) { changes.push('-- → +'); s = s.replace(/(\d)\s*--\s*(?=\d|\()/, '$1+'); }

  // Trailing operator (except a leading unary minus)
  if (/[+*/^]$/.test(s)) { changes.push('trailing operator removed'); s = s.replace(/[+*/^]+$/, ''); }
  // Leading "=" as in "=-5"
  if (s.startsWith('=')) { changes.push('leading = removed'); s = s.slice(1).trim(); }

  // Unbalanced parentheses → close them
  const opens = (s.match(/\(/g) || []).length;
  const closes = (s.match(/\)/g) || []).length;
  if (opens > closes) {
    changes.push(`added ${opens - closes} ")"`);
    s += ')'.repeat(opens - closes);
  }

  s = s.replace(/\s+/g, ' ').trim();
  return { fixed: s, changes };
}

const FILLERS = /\b(um+|uh+|er|hmm+|like|okay|ok|can you|could you|please|hey)\b/gi;

/** Clean up a spoken transcript before it reaches the natural-language engine. */
export function autocorrectVoice(raw: string): AutocorrectResult {
  const changes: string[] = [];
  let s = raw.trim().toLowerCase();
  if (!s) return { fixed: s, changes };

  // Stray punctuation people "speak" (commas, question marks)
  if (/[?,;]/.test(s)) { changes.push('removed punctuation'); s = s.replace(/[?,;]/g, ' '); }

  // Filler words
  const stripped = s.replace(FILLERS, ' ');
  if (stripped !== s) { changes.push('removed filler words'); s = stripped; }

  // Synonyms the NL engine handles best in canonical form
  const canon: Array<[RegExp, string, string]> = [
    [/\bmultiplied by\b/g, 'times', 'multiplied by'],
    [/\bmultiplies\b/g, 'times', 'multiplies'],
    [/\bdivides\b/g, 'divided by', 'divides'],
    [/\bover\b/g, 'divided by', 'over'],
  ];
  for (const [re, to, label] of canon) {
    if (re.test(s)) {
      s = s.replace(re, to);
      changes.push(`${label} → ${to}`);
    }
  }

  s = s.replace(/\s+/g, ' ').trim();
  return { fixed: s, changes };
}
