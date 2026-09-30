// Encoders/decoders for the Cyber tab. All work offline, no dependencies.

export type EncodeOp =
  | 'b64' | 'b64d'
  | 'hex' | 'hexd'
  | 'url' | 'urld'
  | 'rot13' | 'atbash'
  | 'toascii' | 'fromascii';

const ROT13_MAP: Record<string, string> = Object.fromEntries(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('').flatMap((c) => {
    const base = c <= 'Z' ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
    const r = String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
    return [[c, r], [r, c]];
  }),
);

export function rot13(s: string): string {
  return s.split('').map((c) => ROT13_MAP[c] ?? c).join('');
}

export function atbash(s: string): string {
  let out = '';
  for (const c of s) {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) out += String.fromCharCode(155 - code);      // A↔Z
    else if (code >= 97 && code <= 122) out += String.fromCharCode(219 - code); // a↔z
    else out += c;
  }
  return out;
}

function toAscii(s: string): string {
  return Array.from(s).map((c) => c.charCodeAt(0)).join(' ');
}

function fromAscii(s: string): string {
  const parts = s.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return '';
  const bad = parts.find((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255);
  if (bad !== undefined) {
    if (!/^\d/.test(bad)) {
      throw new Error('That looks like text, not ASCII codes. "← ASCII" converts codes (e.g. 60 45 45 45) into text — use "→ ASCII" to convert text to codes.');
    }
    throw new Error('ASCII codes must be numbers 0–255, separated by spaces or commas');
  }
  return parts.map((p) => String.fromCharCode(Number(p))).join('');
}

export function encodeOp(op: EncodeOp, input: string): string {
  switch (op) {
    case 'b64': {
      const bytes = new TextEncoder().encode(input);
      let bin = '';
      for (const b of bytes) bin += String.fromCharCode(b);
      return btoa(bin);
    }
    case 'b64d': {
      const clean = input.replace(/[^A-Za-z0-9+/=]/g, '');
      if (clean.length % 4 === 1) throw new Error('Invalid Base64 length');
      const raw = atob(clean);
      const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    }
    case 'hex': return Array.from(new TextEncoder().encode(input)).map((b) => b.toString(16).padStart(2, '0')).join(' ');
    case 'hexd': {
      const clean = input.replace(/[^0-9a-fA-F]/g, '');
      if (clean.length % 2 !== 0) throw new Error('Hex input has an odd number of digits');
      const bytes = Uint8Array.from(clean.match(/.{2}/g)!.map((p) => parseInt(p, 16)));
      return new TextDecoder('utf-8').decode(bytes);
    }
    case 'url': return encodeURIComponent(input);
    case 'urld': return decodeURIComponent(input);
    case 'rot13': return rot13(input);
    case 'atbash': return atbash(input);
    case 'toascii': return toAscii(input);
    case 'fromascii': return fromAscii(input);
  }
}

export const ENCODE_LABELS: Record<EncodeOp, string> = {
  b64: '→ Base64', b64d: '← Base64',
  hex: '→ Hex', hexd: '← Hex',
  url: '→ URL', urld: '← URL',
  rot13: 'ROT13', atbash: 'Atbash',
  toascii: '→ ASCII', fromascii: '← ASCII',
};
