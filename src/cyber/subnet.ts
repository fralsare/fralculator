// IPv4 subnet calculator for the Cyber tab.

export function ipToInt(ip: string): number | null {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function maskForPrefix(p: number): number {
  return p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
}

/** Count leading 1-bits; null if the mask is not a contiguous prefix. */
export function prefixForMask(mask: number): number | null {
  let count = 0;
  let m = mask >>> 0;
  for (let i = 0; i < 32; i++) {
    if (m & 0x80000000) count++;
    else if (m & 0x7fffffff) return null;
    m = (m << 1) >>> 0;
  }
  return count;
}

export interface SubnetInfo {
  ip: string;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string | null;
  lastHost: string | null;
  totalHosts: number;
  usableHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  isPrivate: boolean;
  range: string;
}

export type SubnetResult = { error?: string; info?: SubnetInfo };

function ipClass(octet: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (octet < 128) return 'A';
  if (octet < 192) return 'B';
  if (octet < 224) return 'C';
  if (octet < 240) return 'D';
  return 'E';
}

function isPrivate(ip: number): boolean {
  const a = (ip >>> 24) & 255;
  const b = (ip >>> 16) & 255;
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/**
 * Compute subnet details. `cidrOrMask` accepts "/24", "24", or "255.255.255.0".
 */
export function subnetCalc(ipStr: string, cidrOrMask: string): SubnetResult {
  const ip = ipToInt(ipStr);
  if (ip === null) return { error: 'Invalid IPv4 address — use dotted quad, e.g. 192.168.1.42' };

  let prefix: number | null = null;
  const m = cidrOrMask.trim();
  if (!m) {
    return { error: 'Enter a CIDR prefix (e.g. /24) or a dotted mask (255.255.255.0)' };
  }
  if (m.startsWith('/')) {
    const p = Number(m.slice(1));
    if (!Number.isInteger(p) || p < 0 || p > 32) return { error: 'CIDR prefix must be 0–32' };
    prefix = p;
  } else if (/^\d+$/.test(m) && Number(m) <= 32) {
    prefix = Number(m);
  } else {
    const mask = ipToInt(m);
    if (mask === null) return { error: 'Mask must be /N or a dotted quad like 255.255.255.0' };
    prefix = prefixForMask(mask);
    if (prefix === null) return { error: 'Mask is not a valid contiguous prefix (e.g. 255.0.255.0)' };
  }

  const mask = maskForPrefix(prefix);
  const wildcard = (~mask) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix <= 30 ? totalHosts - 2 : prefix === 31 ? 2 : 1;
  const firstHost = prefix <= 30 ? intToIp((network + 1) >>> 0) : intToIp(network);
  const lastHost = prefix <= 30 ? intToIp(broadcast - 1) : intToIp(broadcast);

  return {
    info: {
      ip: intToIp(ip),
      prefix,
      mask: intToIp(mask),
      wildcard: intToIp(wildcard),
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      firstHost,
      lastHost,
      totalHosts,
      usableHosts,
      ipClass: ipClass((ip >>> 24) & 255),
      isPrivate: isPrivate(ip),
      range: prefix <= 30 ? `${firstHost} – ${lastHost}` : prefix === 31 ? `${firstHost}, ${lastHost} (point-to-point)` : `${firstHost} (network only)`,
    },
  };
}
