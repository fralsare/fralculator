// Common service ports for the Cyber tab's port lookup.

export interface PortInfo {
  port: number;
  name: string;
  desc: string;
  risk?: string;
}

export const PORTS: PortInfo[] = [
  { port: 20, name: 'FTP-data', desc: 'File Transfer Protocol (data channel)' },
  { port: 21, name: 'FTP', desc: 'File Transfer Protocol (control)', risk: 'often clear-text credentials' },
  { port: 22, name: 'SSH', desc: 'Secure Shell — remote admin' },
  { port: 23, name: 'Telnet', desc: 'Legacy remote shell', risk: 'clear-text — should be disabled' },
  { port: 25, name: 'SMTP', desc: 'Mail transfer (outbound)' },
  { port: 53, name: 'DNS', desc: 'Domain name resolution (TCP+UDP)' },
  { port: 80, name: 'HTTP', desc: 'Web traffic — unencrypted', risk: 'upgrade to HTTPS' },
  { port: 110, name: 'POP3', desc: 'Mail retrieval', risk: 'clear-text' },
  { port: 135, name: 'MSRPC', desc: 'Microsoft RPC endpoint mapper' },
  { port: 139, name: 'NetBIOS', desc: 'NetBIOS session service' },
  { port: 143, name: 'IMAP', desc: 'Mail access', risk: 'clear-text without STARTTLS' },
  { port: 443, name: 'HTTPS', desc: 'Web traffic over TLS' },
  { port: 445, name: 'SMB', desc: 'Windows file sharing', risk: 'Worm/credential-stuffing target (EternalBlue)' },
  { port: 993, name: 'IMAPS', desc: 'IMAP over TLS' },
  { port: 995, name: 'POP3S', desc: 'POP3 over TLS' },
  { port: 1433, name: 'MSSQL', desc: 'Microsoft SQL Server' },
  { port: 1521, name: 'Oracle', desc: 'Oracle database listener' },
  { port: 1723, name: 'L2TP', desc: 'VPN (Layer 2 Tunneling)' },
  { port: 3306, name: 'MySQL', desc: 'MySQL / MariaDB database' },
  { port: 3389, name: 'RDP', desc: 'Windows Remote Desktop', risk: 'Top brute-force target on the internet' },
  { port: 5432, name: 'PostgreSQL', desc: 'PostgreSQL database' },
  { port: 5900, name: 'VNC', desc: 'Virtual Network Computing' },
  { port: 6379, name: 'Redis', desc: 'In-memory data store', risk: 'frequently exposed without auth' },
  { port: 8080, name: 'HTTP-alt', desc: 'Alternate web / dev servers' },
  { port: 8443, name: 'HTTPS-alt', desc: 'Alternate TLS web' },
  { port: 8888, name: 'HTTP-jupyter', desc: 'Jupyter / Hadoop web UI' },
  { port: 9200, name: 'Elasticsearch', desc: 'Search / log analytics API' },
  { port: 11211, name: 'Memcached', desc: 'Caching daemon', risk: 'exposure leaks memory' },
  { port: 27017, name: 'MongoDB', desc: 'MongoDB database', risk: 'frequently exposed without auth' },
  { port: 5000, name: 'WPS', desc: 'Common dev framework port' },
  { port: 8000, name: 'HTTP-proxy', desc: 'Common proxy / dev port' },
];

export function findPorts(query: string): PortInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return PORTS;
  if (/^\d{1,5}$/.test(q)) {
    const p = Number(q);
    return PORTS.filter((x) => x.port === p);
  }
  return PORTS.filter((x) => x.name.toLowerCase().includes(q) || x.desc.toLowerCase().includes(q));
}
