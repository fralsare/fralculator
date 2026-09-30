// Hashing for the Cyber tab.
// MD5 is a compact pure-TS implementation (RFC 1321) so it works in Electron's
// file:// context without any dependency. SHA-* uses the WebCrypto API.

function md5(input: string): string {
  const data = new TextEncoder().encode(input);
  const bitLen = data.length * 8;
  const paddedLen = (((data.length + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(paddedLen);
  buf.set(data);
  buf[data.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(paddedLen - 8, bitLen >>> 0, true);
  dv.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000), true);

  // K[i] = floor(|sin(i+1)| * 2^32) — the standard MD5 constants
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000));
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let i = 0; i < paddedLen; i += 64) {
    const M: number[] = new Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let t = 0; t < 64; t++) {
      let F: number;
      let g: number;
      if (t < 16) { F = (B & C) | (~B & D); g = t; }
      else if (t < 32) { F = (D & B) | (~D & C); g = (5 * t + 1) % 16; }
      else if (t < 48) { F = B ^ C ^ D; g = (3 * t + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * t) % 16; }
      const X = (A + F + K[t] + M[g]) >>> 0;
      const Y = (rotl(X, S[t]) + B) >>> 0;
      A = D; D = C; C = B; B = Y;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new DataView(new ArrayBuffer(16));
  out.setUint32(0, a0, true);
  out.setUint32(4, b0, true);
  out.setUint32(8, c0, true);
  out.setUint32(12, d0, true);
  return Array.from(new Uint8Array(out.buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type ShaAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export async function hashText(input: string, algo: 'MD5' | ShaAlgo): Promise<string> {
  if (algo === 'MD5') return md5(input);
  if (!globalThis.crypto?.subtle) {
    throw new Error('WebCrypto unavailable in this context — MD5 still works.');
  }
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
