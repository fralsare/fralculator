// Password strength estimation for the Cyber tab.

export interface PasswordReport {
  poolSize: number;
  entropyBits: number;
  combinations: string;
  crackTimes: Array<{ label: string; rate: number; text: string }>;
  verdict: 'very weak' | 'weak' | 'okay' | 'strong' | 'very strong';
  tips: string[];
}

export function passwordReport(pw: string): PasswordReport {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  const entropy = pw.length === 0 ? 0 : pw.length * Math.log2(pool);
  const combinations = Math.pow(2, entropy);

  const rates: Array<{ label: string; rate: number }> = [
    { label: 'Offline, single GPU', rate: 1e10 },
    { label: 'Offline, GPU cluster', rate: 1e12 },
    { label: 'Online, 100 tries/sec', rate: 100 },
  ];
  const crackTimes = rates.map((r) => ({
    ...r,
    text: humanDuration((combinations / 2) / r.rate),
  }));

  let verdict: PasswordReport['verdict'];
  if (entropy < 40) verdict = 'very weak';
  else if (entropy < 60) verdict = 'weak';
  else if (entropy < 80) verdict = 'okay';
  else if (entropy < 100) verdict = 'strong';
  else verdict = 'very strong';

  const tips: string[] = [];
  if (pw.length < 12) tips.push('Use 12+ characters — length beats complexity.');
  if (!/[A-Z]/.test(pw)) tips.push('Add uppercase letters.');
  if (!/[0-9]/.test(pw)) tips.push('Add digits.');
  if (!/[^a-zA-Z0-9]/.test(pw)) tips.push('Add symbols (!@#$…).');
  if (/[a-z]{3,}|[0-9]{3,}/.test(pw)) tips.push('Avoid runs like "aaa" or "123".');

  return {
    poolSize: pool,
    entropyBits: entropy,
    combinations: combinations >= 1e21 ? combinations.toExponential(3) : Math.round(combinations).toLocaleString(),
    crackTimes,
    verdict,
    tips,
  };
}

export type PasswordRating = 'strong' | 'medium' | 'weak';

/** Coarse 3-tier rating from the entropy already computed by passwordReport. */
export function ratePassword(pw: string): PasswordRating {
  const { entropyBits } = passwordReport(pw);
  if (entropyBits < 60) return 'weak';
  if (entropyBits < 80) return 'medium';
  return 'strong';
}

export interface GeneratorOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};

function randomInt(max: number): number {
  // Rejection sampling so every value in [0, max) is equally likely.
  const range = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let v: number;
  do { v = crypto.getRandomValues(buf)[0]; } while (v >= range);
  return v % max;
}

/** Cryptographically random password, containing at least one char from each enabled set. */
export function generatePassword(opts: GeneratorOptions): string {
  const { lower, upper, digits, symbols } = opts;
  const active: string[] = [];
  if (lower) active.push(SETS.lower);
  if (upper) active.push(SETS.upper);
  if (digits) active.push(SETS.digits);
  if (symbols) active.push(SETS.symbols);
  if (active.length === 0) throw new Error('Pick at least one character set.');
  if (opts.length < active.length) throw new Error(`Length must be at least ${active.length} — one per enabled set.`);
  const length = Math.min(128, Math.max(4, Math.round(opts.length)));

  const pool = active.join('');
  const chars: number[] = active.map((set) => set.charCodeAt(randomInt(set.length)));
  for (let i = chars.length; i < length; i++) chars.push(pool.charCodeAt(randomInt(pool.length)));
  // Fisher–Yates with the same RNG so the guaranteed chars land at random positions.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.map((c) => String.fromCharCode(c)).join('');
}

export function humanDuration(seconds: number): string {
  if (!isFinite(seconds)) return 'practically forever';
  if (seconds < 1) return '< 1 second';
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  const units: Array<[string, number]> = [
    ['minute', 60], ['hour', 3600], ['day', 86400],
    ['year', 31557600], ['century', 3.15576e9],
  ];
  let s = seconds;
  for (const [name, size] of units) {
    if (s >= size) {
      const v = s / size;
      if (v < 10) return `${v.toFixed(1)} ${name}${v >= 1.5 ? 's' : ''}`;
      if (v < 1000) return `${Math.round(v).toLocaleString()} ${name}s`;
      // fall through to next unit
      continue;
    }
  }
  return `${Math.round(seconds).toLocaleString()} seconds`;
}
